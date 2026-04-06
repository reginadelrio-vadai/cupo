import { NextRequest, NextResponse } from 'next/server'
import { authenticateAgent, isAuthError } from '@/lib/agent-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getAvailableSlotsForRange } from '@/lib/services/availability.service'
import { handleApiError, AppError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAgent(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const serviceId = searchParams.get('service_id')
    const professionalId = searchParams.get('professional_id') || undefined

    if (!startDate || !endDate || !serviceId) {
      throw new AppError('VALIDATION_ERROR', 'start_date, end_date and service_id are required', 400)
    }

    const supabase = createSupabaseAdminClient()

    const { data: org } = await supabase
      .from('organizations')
      .select('timezone')
      .eq('id', auth.organizationId)
      .single()

    const timezone = org?.timezone || 'America/Mexico_City'

    const slotsByDay = await getAvailableSlotsForRange(supabase, {
      organizationId: auth.organizationId,
      serviceId,
      professionalId,
      startDate,
      endDate,
      timezone,
    })

    // Summary: which days have availability
    const summary = Object.entries(slotsByDay).map(([date, slots]) => ({
      date,
      slots_count: slots.length,
    }))

    return NextResponse.json({
      data: { start_date: startDate, end_date: endDate, timezone, summary, slots_by_day: slotsByDay },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
