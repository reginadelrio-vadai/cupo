import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { handleApiError, AppError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    const orgId = user.app_metadata?.organization_id
    if (!orgId) throw new AppError('NO_ORG', 'No organization', 400)

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const professionalId = searchParams.get('professional_id')

    if (!start || !end) throw new AppError('VALIDATION_ERROR', 'start and end are required', 400)

    let query = supabase
      .from('professional_external_events')
      .select('id, professional_id, summary, start_time, end_time, is_all_day, source, professionals(display_name)')
      .eq('organization_id', orgId)
      .gte('start_time', start)
      .lt('start_time', end)
      .neq('status', 'cancelled')
      .order('start_time')

    if (professionalId) query = query.eq('professional_id', professionalId)

    const { data: events, error } = await query
    if (error) throw error

    return NextResponse.json({ data: { events: events || [] } })
  } catch (error) {
    return handleApiError(error)
  }
}
