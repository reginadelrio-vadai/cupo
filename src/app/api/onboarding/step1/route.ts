import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { handleApiError, AppError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    const { name, timezone } = await request.json()
    if (!name || !timezone) throw new AppError('VALIDATION_ERROR', 'Nombre y timezone son requeridos', 400)

    const admin = createSupabaseAdminClient()

    // Check if user already has an org
    if (user.app_metadata?.organization_id) {
      return NextResponse.json({ data: { organizationId: user.app_metadata.organization_id } })
    }

    // Create organization (slug will be set in step 5)
    const tempSlug = `org-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({ name, slug: tempSlug, timezone })
      .select('id')
      .single()
    if (orgError) throw orgError

    // Create org member (owner)
    const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Owner'
    await admin.from('organization_members').insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner',
      display_name: displayName,
    })

    // Create subscription (pro trial, 14 days)
    const { data: proPlan } = await admin
      .from('subscription_plans')
      .select('id')
      .eq('slug', 'professional')
      .single()

    if (proPlan) {
      const now = new Date()
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      await admin.from('organization_subscriptions').insert({
        organization_id: org.id,
        plan_id: proPlan.id,
        status: 'trialing',
        current_period_start: now.toISOString(),
        current_period_end: trialEnd.toISOString(),
      })
    }

    // Create booking page config with defaults
    await admin.from('booking_page_config').insert({ organization_id: org.id })

    // Store industry in org metadata (using address field temporarily, or we add it)
    // We'll use the features JSONB or just skip for now since it's informational

    // Update user app_metadata
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { organization_id: org.id, role: 'owner' },
    })

    return NextResponse.json({ data: { organizationId: org.id } })
  } catch (error) {
    return handleApiError(error)
  }
}
