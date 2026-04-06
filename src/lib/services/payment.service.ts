import { SupabaseClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe/client'
import { format } from 'date-fns'
import { AppError } from '@/lib/errors'
import { emitWebhook } from '@/lib/webhooks/emitter'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ============================================================
// createCheckoutSession
// ============================================================

export async function createCheckoutSession(
  supabase: SupabaseClient,
  appointmentId: string,
  organizationId: string
) {
  const stripe = getStripe()

  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, start_time, end_time, client_id, service_id, professional_id, status, payment_timeout_minutes')
    .eq('id', appointmentId)
    .eq('organization_id', organizationId)
    .single()

  if (!appointment) throw new AppError('APPOINTMENT_NOT_FOUND', 'Cita no encontrada', 404)
  if (appointment.status !== 'pending_payment') {
    throw new AppError('INVALID_STATUS', 'La cita no requiere pago', 400)
  }

  const { data: service } = await supabase
    .from('services')
    .select('name, price, currency')
    .eq('id', appointment.service_id)
    .single()

  if (!service) throw new AppError('SERVICE_NOT_FOUND', 'Servicio no encontrado', 404)

  const { data: org } = await supabase
    .from('organizations')
    .select('slug')
    .eq('id', organizationId)
    .single()

  const timeoutMinutes = appointment.payment_timeout_minutes || 15
  const expiresAt = Math.floor(Date.now() / 1000) + Math.max(timeoutMinutes * 60, 1800)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: (service.currency || 'MXN').toLowerCase(),
        unit_amount: Math.round(service.price * 100),
        product_data: {
          name: service.name,
          description: `Cita: ${format(new Date(appointment.start_time), 'dd/MM/yyyy HH:mm')}`,
        },
      },
      quantity: 1,
    }],
    metadata: {
      appointment_id: appointmentId,
      organization_id: organizationId,
    },
    expires_at: expiresAt,
    success_url: `${APP_URL}/book/${org?.slug || 'app'}?success=true&appointment=${appointmentId}`,
    cancel_url: `${APP_URL}/book/${org?.slug || 'app'}?cancelled=true`,
  })

  // Save payment record
  await supabase.from('payments').insert({
    organization_id: organizationId,
    appointment_id: appointmentId,
    amount: service.price,
    currency: service.currency || 'MXN',
    stripe_session_id: session.id,
    status: 'pending',
  })

  return { checkoutUrl: session.url }
}

// ============================================================
// confirmPayment — Idempotent (patrón Menna)
// ============================================================

export async function confirmPayment(
  supabase: SupabaseClient,
  stripeEventId: string,
  sessionId: string,
  metadata: { appointment_id: string; organization_id: string }
) {
  // STEP 1: Dedup via processed_webhook_events
  const { error: dedupError } = await supabase
    .from('processed_webhook_events')
    .insert({ stripe_event_id: stripeEventId, event_type: 'checkout.session.completed' })

  if (dedupError?.code === '23505') {
    console.log(`[stripe] Event ${stripeEventId} already processed — skipping`)
    return { alreadyProcessed: true }
  }

  // STEP 2: Get appointment
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, status, organization_id, professional_id, service_id, client_id, start_time, end_time, notes')
    .eq('id', metadata.appointment_id)
    .single()

  if (!appointment || appointment.status !== 'pending_payment') {
    return { alreadyProcessed: false }
  }

  // STEP 3: Confirm appointment
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', metadata.appointment_id)
    .eq('status', 'pending_payment')

  if (updateError) throw updateError

  // STEP 4: Update payment
  await supabase
    .from('payments')
    .update({ status: 'completed', paid_at: new Date().toISOString() })
    .eq('stripe_session_id', sessionId)

  // STEP 5: Status log
  await supabase.from('appointment_status_log').insert({
    appointment_id: metadata.appointment_id,
    previous_status: 'pending_payment',
    new_status: 'confirmed',
    change_source: 'stripe_webhook',
    notes: `Payment completed (Stripe event: ${stripeEventId})`,
  })

  // STEP 6: Google Calendar + Meet (now that payment is confirmed)
  // Imported dynamically to avoid circular deps — fire-and-forget
  try {
    const { createEventForAppointment } = await import('./google-calendar.service')
    await createEventForAppointment(supabase, metadata.appointment_id)
  } catch (err) {
    console.error('[stripe] Google Calendar sync failed (non-blocking):', err)
  }

  // STEP 7: Notifications — fire-and-forget
  try {
    const { sendBookingConfirmation } = await import('./notification.service')
    await sendBookingConfirmation(supabase, metadata.appointment_id)
  } catch (err) {
    console.error('[stripe] Notification failed (non-blocking):', err)
  }

  // STEP 8: Webhooks
  emitWebhook({
    organizationId: appointment.organization_id,
    eventType: 'payment.completed',
    payload: { appointment_id: metadata.appointment_id, stripe_event_id: stripeEventId },
  }).catch(console.error)

  emitWebhook({
    organizationId: appointment.organization_id,
    eventType: 'appointment.confirmed',
    payload: { appointment_id: metadata.appointment_id },
  }).catch(console.error)

  return { alreadyProcessed: false, appointmentId: metadata.appointment_id }
}
