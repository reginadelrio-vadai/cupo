import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { handleApiError, AppError } from '@/lib/errors'
import { SLUG_REGEX } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)
    }

    // Already has an org
    if (user.app_metadata?.organization_id) {
      throw new AppError('ALREADY_ONBOARDED', 'User already has an organization', 400)
    }

    const { name, slug } = await request.json()

    if (!name || !slug) {
      throw new AppError('VALIDATION_ERROR', 'Name and slug are required', 400)
    }

    if (!SLUG_REGEX.test(slug)) {
      throw new AppError('INVALID_SLUG', 'Invalid slug format', 400)
    }

    const admin = createSupabaseAdminClient()

    // Check slug availability
    const { data: existing } = await admin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      throw new AppError('SLUG_TAKEN', 'This URL is already taken', 409)
    }

    // Create organization
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({ name, slug })
      .select('id')
      .single()

    if (orgError) throw orgError

    // Get free plan
    const { data: freePlan } = await admin
      .from('subscription_plans')
      .select('id')
      .eq('slug', 'free')
      .single()

    // Create subscription
    if (freePlan) {
      await admin
        .from('organization_subscriptions')
        .insert({
          organization_id: org.id,
          plan_id: freePlan.id,
          status: 'active',
        })
    }

    // Create org member
    const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Owner'

    await admin
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'owner',
        display_name: displayName,
      })

    // Create default professional from owner
    await admin
      .from('professionals')
      .insert({
        organization_id: org.id,
        display_name: displayName,
        email: user.email,
      })

    // Create booking page config
    await admin
      .from('booking_page_config')
      .insert({ organization_id: org.id })

    // Update user app_metadata with org info
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        organization_id: org.id,
        role: 'owner',
      },
    })

    return NextResponse.json({ data: { organizationId: org.id } })
  } catch (error) {
    return handleApiError(error)
  }
}
