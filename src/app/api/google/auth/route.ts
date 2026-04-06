import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getAuthUrl } from '@/lib/google/calendar'
import { handleApiError, AppError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    const { searchParams } = new URL(request.url)
    const professionalId = searchParams.get('professional_id')
    if (!professionalId) throw new AppError('VALIDATION_ERROR', 'professional_id is required', 400)

    const orgId = user.app_metadata?.organization_id
    if (!orgId) throw new AppError('NO_ORG', 'No organization', 400)

    const state = JSON.stringify({ professional_id: professionalId, organization_id: orgId })
    const url = getAuthUrl(state)

    if (!url) throw new AppError('CONFIG_ERROR', 'Google OAuth not configured', 500)

    return NextResponse.redirect(url)
  } catch (error) {
    return handleApiError(error)
  }
}
