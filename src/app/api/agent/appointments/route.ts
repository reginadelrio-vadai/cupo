import { NextRequest, NextResponse } from 'next/server'
import { authenticateAgent, isAuthError } from '@/lib/agent-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createBooking } from '@/lib/services/appointment.service'
import { handleApiError, AppError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAgent(request)
    if (isAuthError(auth)) return auth

    const body = await request.json()
    const { service_id, professional_id, client_id, start_time, notes, source } = body

    if (!service_id || !professional_id || !client_id || !start_time) {
      throw new AppError(
        'VALIDATION_ERROR',
        'service_id, professional_id, client_id and start_time are required',
        400
      )
    }

    const supabase = createSupabaseAdminClient()
    const result = await createBooking(supabase, {
      organizationId: auth.organizationId,
      serviceId: service_id,
      professionalId: professional_id,
      clientId: client_id,
      startTime: start_time,
      notes,
      source: source || 'whatsapp',
    })

    return NextResponse.json(
      {
        data: {
          appointment: result.appointment,
          requires_payment: result.requiresPayment,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
