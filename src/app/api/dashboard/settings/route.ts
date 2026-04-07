import { NextRequest, NextResponse } from 'next/server'
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

    if (body.organization) {
      const allowed = ['name', 'primary_color', 'timezone', 'phone', 'email', 'address']
      const updates: Record<string, unknown> = {}
      for (const key of allowed) {
        if (body.organization[key] !== undefined) updates[key] = body.organization[key]
      }
      if (Object.keys(updates).length) {
        await supabase.from('organizations').update(updates).eq('id', orgId)
      }
    }

    if (body.bookingConfig) {
      const allowed = ['is_active', 'welcome_message', 'min_advance_hours', 'max_advance_days', 'primary_color', 'logo_url']
      const updates: Record<string, unknown> = {}
      for (const key of allowed) {
        if (body.bookingConfig[key] !== undefined) updates[key] = body.bookingConfig[key]
      }
      if (Object.keys(updates).length) {
        await supabase.from('booking_page_config').update(updates).eq('organization_id', orgId)
      }
    }

    return NextResponse.json({ data: { updated: true } })
  } catch (error) {
    return handleApiError(error)
  }
}
