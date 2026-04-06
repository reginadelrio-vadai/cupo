import { NextRequest, NextResponse } from 'next/server'
import { authenticateAgent, isAuthError } from '@/lib/agent-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getAvailableSlots } from '@/lib/services/availability.service'
import { handleApiError, AppError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAgent(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const serviceId = searchParams.get('service_id')
    const professionalId = searchParams.get('professional_id') || undefined

    if (!date || !serviceId) {
      throw new AppError('VALIDATION_ERROR', 'date and service_id are required', 400)
    }

    const supabase = createSupabaseAdminClient()

    // Get org timezone
    const { data: org } = await supabase
      .from('organizations')
      .select('timezone')
      .eq('id', auth.organizationId)
      .single()

    const timezone = org?.timezone || 'America/Mexico_City'

    const slots = await getAvailableSlots(supabase, {
      organizationId: auth.organizationId,
      serviceId,
      professionalId,
      date,
      timezone,
    })

    return NextResponse.json({
      data: { date, timezone, slots_count: slots.length, slots },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
