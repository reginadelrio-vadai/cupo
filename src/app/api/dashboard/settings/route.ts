import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { handleApiError, AppError } from '@/lib/errors'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)
    const orgId = user.app_metadata?.organization_id

    const [orgResult, configResult, subResult] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', orgId).single(),
      supabase.from('booking_page_config').select('*').eq('organization_id', orgId).single(),
      supabase.from('organization_subscriptions').select('*, subscription_plans(name, slug)').eq('organization_id', orgId).single(),
    ])

    return NextResponse.json({
      data: {
        organization: orgResult.data,
        bookingConfig: configResult.data,
        subscription: subResult.data,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)
    const orgId = user.app_metadata?.organization_id

    const body = await request.json()

    // Build the booking_page_config mirror. IMPORTANT: the client echoes the
    // whole `bookingConfig` row back (including stale primary_color/logo_url
    // that the UI never edits), so we must apply those non-editable fields
    // from the `organization` object LAST to avoid reintroducing stale values.
    const configMirror: Record<string, unknown> = {}

    if (body.bookingConfig) {
      const editableInBookingConfig = [
        'is_active',
        'welcome_message',
        'min_advance_hours',
        'max_advance_days',
      ]
      for (const key of editableInBookingConfig) {
        if (body.bookingConfig[key] !== undefined) configMirror[key] = body.bookingConfig[key]
      }
    }

    if (body.organization) {
      const allowed = ['name', 'primary_color', 'timezone', 'phone', 'email', 'address', 'logo_url']
      const updates: Record<string, unknown> = {}
      for (const key of allowed) {
        if (body.organization[key] !== undefined) updates[key] = body.organization[key]
      }
      if (Object.keys(updates).length) {
        await supabase.from('organizations').update(updates).eq('id', orgId)
      }
      // Mirror branding to booking_page_config so the booking page reflects
      // the new values (onboarding may have pinned config.primary_color /
      // config.logo_url, which would otherwise shadow the org value forever).
      if (updates.primary_color !== undefined) configMirror.primary_color = updates.primary_color
      if (updates.logo_url !== undefined) configMirror.logo_url = updates.logo_url
    }

    if (Object.keys(configMirror).length) {
      await supabase.from('booking_page_config').update(configMirror).eq('organization_id', orgId)
    }

    // Invalidate the booking page cache so branding changes are visible.
    const { data: orgRow } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', orgId)
      .single()
    if (orgRow?.slug) {
      try { revalidatePath(`/book/${orgRow.slug}`) } catch { /* noop */ }
    }

    return NextResponse.json({ data: { updated: true } })
  } catch (error) {
    return handleApiError(error)
  }
}
