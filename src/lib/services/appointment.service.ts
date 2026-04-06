import { SupabaseClient } from '@supabase/supabase-js'
import { addMinutes, format } from 'date-fns'
import { AppError } from '@/lib/errors'
import { VALID_STATUS_TRANSITIONS } from '@/lib/constants'
import { emitWebhook } from '@/lib/webhooks/emitter'

// ============================================================
// Types
// ============================================================

interface CreateBookingParams {
  organizationId: string
  serviceId: string
  professionalId: string
  clientId: string
  startTime: string // ISO 8601
  notes?: string
  source: 'booking_page' | 'whatsapp' | 'manual' | 'api'
}

interface CreateBookingResult {
  appointment: Record<string, unknown>
  requiresPayment: boolean
}

// ============================================================
// createBooking
// ============================================================

export async function createBooking(
  supabase: SupabaseClient,
  params: CreateBookingParams
): Promise<CreateBookingResult> {
  const { organizationId, serviceId, professionalId, clientId, startTime, notes, source } = params

  // 1. Validate service
  const { data: service } = await supabase
    .from('services')
    .select('id, duration_minutes, buffer_after_minutes, requires_payment, is_active')
    .eq('id', serviceId)
    .eq('organization_id', organizationId)
    .single()

  if (!service || !service.is_active) {
    throw new AppError('SERVICE_NOT_FOUND', 'Servicio no encontrado o inactivo', 404)
  }

  // Validate professional
  const { data: professional } = await supabase
    .from('professionals')
    .select('id, display_name, is_active')
    .eq('id', professionalId)
    .eq('organization_id', organizationId)
    .single()

  if (!professional || !professional.is_active) {
    throw new AppError('PROFESSIONAL_NOT_FOUND', 'Profesional no encontrado o inactivo', 404)
  }

  // Validate professional offers this service
  const { data: profService } = await supabase
    .from('professional_services')
    .select('id')
    .eq('professional_id', professionalId)
    .eq('service_id', serviceId)
    .eq('is_active', true)
    .single()

  if (!profService) {
    throw new AppError('SERVICE_NOT_OFFERED', 'Este profesional no ofrece este servicio', 400)
  }

  // 2. Calculate end time
  const start = new Date(startTime)
  const end = addMinutes(start, service.duration_minutes)

  // 3. Check and lock slot (advisory lock + conflict check)
  const { data: slotFree } = await supabase.rpc('check_and_lock_slot', {
    p_professional_id: professionalId,
    p_start_time: start.toISOString(),
    p_end_time: end.toISOString(),
  })

  if (!slotFree) {
    throw new AppError('SLOT_TAKEN', 'Este horario ya está ocupado', 409)
  }

  // 4. Determine status
  const status = service.requires_payment ? 'pending_payment' : 'confirmed'

  // 5. Insert appointment
  const { data: appointment, error: insertError } = await supabase
    .from('appointments')
    .insert({
      organization_id: organizationId,
      professional_id: professionalId,
      service_id: serviceId,
      client_id: clientId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status,
      source,
      notes: notes || null,
    })
    .select('*')
    .single()

  if (insertError) {
    // Unique partial index catches double-booking if advisory lock failed
    if (insertError.code === '23505') {
      throw new AppError('SLOT_TAKEN', 'Este horario ya está ocupado', 409)
    }
    throw insertError
  }

  // 6. Status log
  await supabase.from('appointment_status_log').insert({
    appointment_id: appointment.id,
    previous_status: null,
    new_status: status,
    change_source: source,
    notes: `Cita creada por ${source}`,
  })

  // 7/8. Side effects (fire-and-forget)
  emitWebhook({
    organizationId,
    eventType: 'appointment.created',
    payload: {
      appointment_id: appointment.id,
      status,
      requires_payment: service.requires_payment,
      professional: professional.display_name,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    },
  }).catch(console.error)

  return {
    appointment,
    requiresPayment: service.requires_payment,
  }
}

// ============================================================
// cancelAppointment
// ============================================================

export async function cancelAppointment(
  supabase: SupabaseClient,
  organizationId: string,
  appointmentId: string,
  cancelledBy: string,
  reason?: string
): Promise<Record<string, unknown>> {
  const { data: appointment } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .eq('organization_id', organizationId)
    .single()

  if (!appointment) {
    throw new AppError('APPOINTMENT_NOT_FOUND', 'Cita no encontrada', 404)
  }

  const allowed = VALID_STATUS_TRANSITIONS[appointment.status]
  if (!allowed?.includes('cancelled')) {
    throw new AppError('INVALID_TRANSITION', `No se puede cancelar una cita con status '${appointment.status}'`, 400)
  }

  const { data: updated, error } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancellation_reason: reason || null,
    })
    .eq('id', appointmentId)
    .select('*')
    .single()

  if (error) throw error

  // Status log
  await supabase.from('appointment_status_log').insert({
    appointment_id: appointmentId,
    previous_status: appointment.status,
    new_status: 'cancelled',
    change_source: cancelledBy,
    notes: reason || 'Cancelada',
  })

  // Webhook (fire-and-forget)
  emitWebhook({
    organizationId,
    eventType: 'appointment.cancelled',
    payload: { appointment_id: appointmentId, cancelled_by: cancelledBy, reason },
  }).catch(console.error)

  return updated
}

// ============================================================
// rescheduleAppointment
// ============================================================

export async function rescheduleAppointment(
  supabase: SupabaseClient,
  organizationId: string,
  appointmentId: string,
  newStartTime: string,
  source: string
): Promise<Record<string, unknown>> {
  const { data: appointment } = await supabase
    .from('appointments')
    .select('*, services(duration_minutes)')
    .eq('id', appointmentId)
    .eq('organization_id', organizationId)
    .single()

  if (!appointment) {
    throw new AppError('APPOINTMENT_NOT_FOUND', 'Cita no encontrada', 404)
  }

  if (!['confirmed', 'pending_payment'].includes(appointment.status)) {
    throw new AppError('INVALID_TRANSITION', `No se puede reagendar una cita con status '${appointment.status}'`, 400)
  }

  const newStart = new Date(newStartTime)
  const duration = appointment.services?.duration_minutes || 30
  const newEnd = addMinutes(newStart, duration)

  // Check slot availability (exclude this appointment)
  const { data: slotFree } = await supabase.rpc('check_and_lock_slot', {
    p_professional_id: appointment.professional_id,
    p_start_time: newStart.toISOString(),
    p_end_time: newEnd.toISOString(),
    p_exclude_appointment_id: appointmentId,
  })

  if (!slotFree) {
    throw new AppError('SLOT_TAKEN', 'El nuevo horario ya está ocupado', 409)
  }

  const oldStart = appointment.start_time

  // Update — status stays the same
  const { data: updated, error } = await supabase
    .from('appointments')
    .update({
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString(),
    })
    .eq('id', appointmentId)
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') throw new AppError('SLOT_TAKEN', 'El nuevo horario ya está ocupado', 409)
    throw error
  }

  // Status log
  await supabase.from('appointment_status_log').insert({
    appointment_id: appointmentId,
    previous_status: appointment.status,
    new_status: appointment.status,
    change_source: source,
    notes: `Reagendada de ${formatForLog(oldStart)} a ${formatForLog(newStartTime)}`,
  })

  // Webhook
  emitWebhook({
    organizationId,
    eventType: 'appointment.rescheduled',
    payload: {
      appointment_id: appointmentId,
      old_start_time: oldStart,
      new_start_time: newStartTime,
    },
  }).catch(console.error)

  return updated
}

// ============================================================
// completeAppointment
// ============================================================

export async function completeAppointment(
  supabase: SupabaseClient,
  organizationId: string,
  appointmentId: string,
  changedBy: string
): Promise<Record<string, unknown>> {
  const { data: appointment } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .eq('organization_id', organizationId)
    .single()

  if (!appointment) throw new AppError('APPOINTMENT_NOT_FOUND', 'Cita no encontrada', 404)

  const allowed = VALID_STATUS_TRANSITIONS[appointment.status]
  if (!allowed?.includes('completed')) {
    throw new AppError('INVALID_TRANSITION', `No se puede completar una cita con status '${appointment.status}'`, 400)
  }

  const { data: updated, error } = await supabase
    .from('appointments')
    .update({ status: 'completed' })
    .eq('id', appointmentId)
    .select('*')
    .single()

  if (error) throw error

  await supabase.from('appointment_status_log').insert({
    appointment_id: appointmentId,
    previous_status: appointment.status,
    new_status: 'completed',
    change_source: changedBy,
  })

  emitWebhook({
    organizationId,
    eventType: 'appointment.completed',
    payload: { appointment_id: appointmentId },
  }).catch(console.error)

  return updated
}

// ============================================================
// markNoShow
// ============================================================

export async function markNoShow(
  supabase: SupabaseClient,
  organizationId: string,
  appointmentId: string,
  changedBy: string
): Promise<Record<string, unknown>> {
  const { data: appointment } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .eq('organization_id', organizationId)
    .single()

  if (!appointment) throw new AppError('APPOINTMENT_NOT_FOUND', 'Cita no encontrada', 404)

  const allowed = VALID_STATUS_TRANSITIONS[appointment.status]
  if (!allowed?.includes('no_show')) {
    throw new AppError('INVALID_TRANSITION', `No se puede marcar no-show una cita con status '${appointment.status}'`, 400)
  }

  const { data: updated, error } = await supabase
    .from('appointments')
    .update({ status: 'no_show' })
    .eq('id', appointmentId)
    .select('*')
    .single()

  if (error) throw error

  await supabase.from('appointment_status_log').insert({
    appointment_id: appointmentId,
    previous_status: appointment.status,
    new_status: 'no_show',
    change_source: changedBy,
  })

  emitWebhook({
    organizationId,
    eventType: 'appointment.no_show',
    payload: { appointment_id: appointmentId },
  }).catch(console.error)

  return updated
}

// ============================================================
// Helpers
// ============================================================

function formatForLog(isoDate: string): string {
  try {
    return format(new Date(isoDate), 'dd/MM HH:mm')
  } catch {
    return isoDate
  }
}
