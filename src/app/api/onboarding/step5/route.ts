import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { handleApiError, AppError } from '@/lib/errors'
import { SLUG_REGEX } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    const orgId = user.app_metadata?.organization_id
    if (!orgId) throw new AppError('NO_ORG', 'Complete step 1 first', 400)

    const { slug, primary_color, logo_url } = await request.json()
    if (!slug) throw new AppError('VALIDATION_ERROR', 'Slug es requerido', 400)
    if (!SLUG_REGEX.test(slug)) throw new AppError('INVALID_SLUG', 'Formato de slug inválido', 400)

    const admin = createSupabaseAdminClient()

    // Check slug uniqueness (exclude own org)
    const { data: existing } = await admin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .neq('id', orgId)
      .single()

    if (existing) throw new AppError('SLUG_TAKEN', 'Esta URL ya está en uso', 409)

    // Update org with final slug and branding
    const updates: Record<string, unknown> = { slug }
    if (primary_color) updates.primary_color = primary_color
    if (logo_url) updates.logo_url = logo_url

    const { error: orgError } = await admin
      .from('organizations')
      .update(updates)
      .eq('id', orgId)

    if (orgError) throw orgError

    // Update booking page config
    const configUpdates: Record<string, unknown> = { is_active: true }
    if (primary_color) configUpdates.primary_color = primary_color
    if (logo_url) configUpdates.logo_url = logo_url

    await admin
      .from('booking_page_config')
      .update(configUpdates)
      .eq('organization_id', orgId)

    return NextResponse.json({ data: { slug } })
  } catch (error) {
    return handleApiError(error)
  }
}
