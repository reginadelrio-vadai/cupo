import { NextRequest, NextResponse } from 'next/server'
import { authenticateAgent, isAuthError } from '@/lib/agent-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import {
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
  markNoShow,
} from '@/lib/services/appointment.service'
import { handleApiError, AppError } from '@/lib/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateAgent(request)
    if (isAuthError(auth)) return auth

    const supabase = createSupabaseAdminClient()
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('*, services(name, duration_minutes, price), professionals(display_name), clients(name, phone, email)')
      .eq('id', params.id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (error || !appointment) {
      throw new AppError('NOT_FOUND', 'Cita no encontrada', 404)
    }

    return NextResponse.json({ data: { appointment } })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateAgent(request)
    if (isAuthError(auth)) return auth

    const body = await request.json()
    const supabase = createSupabaseAdminClient()

    // Cancel
    if (body.status === 'cancelled') {
      const updated = await cancelAppointment(
        supabase,
        auth.organizationId,
        params.id,
        'agent',
        body.cancellation_reason
      )
      return NextResponse.json({ data: { appointment: updated } })
    }

    // Reschedule
    if (body.start_time) {
      const updated = await rescheduleAppointment(
        supabase,
        auth.organizationId,
        params.id,
        body.start_time,
        'agent'
      )
      return NextResponse.json({ data: { appointment: updated } })
    }

    // Complete
    if (body.status === 'completed') {
      const updated = await completeAppointment(
        supabase,
        auth.organizationId,
        params.id,
        'agent'
      )
      return NextResponse.json({ data: { appointment: updated } })
    }

    // No-show
    if (body.status === 'no_show') {
      const updated = await markNoShow(
        supabase,
        auth.organizationId,
        params.id,
        'agent'
      )
      return NextResponse.json({ data: { appointment: updated } })
    }

    throw new AppError('VALIDATION_ERROR', 'Specify status or start_time to update', 400)
  } catch (error) {
    return handleApiError(error)
  }
}
