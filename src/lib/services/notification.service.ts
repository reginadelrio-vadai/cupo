import { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { sendWhaapyMessage } from '@/lib/whaapy/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

/**
 * Send booking confirmation via email + WhatsApp.
 * Fire-and-forget — never blocks the main flow.
 */
export async function sendBookingConfirmation(
  supabase: SupabaseClient,
  appointmentId: string
): Promise<void> {
  try {
    const { data: appointment } = await supabase
      .from('appointments')
      .select('id, start_time, end_time, google_meet_url, organization_id, professional_id, service_id, client_id')
      .eq('id', appointmentId)
      .single()

    if (!appointment) return

    const [orgResult, profResult, svcResult, clientResult] = await Promise.all([
      supabase.from('organizations').select('name, timezone').eq('id', appointment.organization_id).single(),
      supabase.from('professionals').select('display_name').eq('id', appointment.professional_id).single(),
      supabase.from('services').select('name, is_virtual').eq('id', appointment.service_id).single(),
      supabase.from('clients').select('name, email, phone_normalized').eq('id', appointment.client_id).single(),
    ])

    const org = orgResult.data
    const professional = profResult.data
    const service = svcResult.data
    const client = clientResult.data

    if (!org || !client) return

    const timezone = org.timezone || 'America/Mexico_City'
    const zonedDate = toZonedTime(new Date(appointment.start_time), timezone)
    const dateStr = format(zonedDate, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })

    // Email via Resend
    if (resend && client.email) {
      resend.emails.send({
        from: `${org.name} <noreply@resend.dev>`,
        to: client.email,
        subject: `Cita confirmada: ${service?.name || 'Cita'}`,
        html: buildConfirmationEmail({
          clientName: client.name,
          serviceName: service?.name || 'Cita',
          professionalName: professional?.display_name || '',
          dateStr,
          meetUrl: appointment.google_meet_url,
          orgName: org.name,
        }),
      }).catch(err => console.error('[notification] Email failed:', err))
    }

    // WhatsApp via Whaapy
    if (client.phone_normalized) {
      const { data: integration } = await supabase
        .from('integrations')
        .select('config, is_active')
        .eq('organization_id', appointment.organization_id)
        .eq('type', 'whatsapp')
        .eq('is_active', true)
        .single()

      if (integration) {
        const message = [
          `Hola ${client.name}, tu cita ha sido confirmada:`,
          `${service?.name} con ${professional?.display_name}`,
          dateStr,
          appointment.google_meet_url ? `Link de videollamada: ${appointment.google_meet_url}` : '',
          `¡Te esperamos!`,
        ].filter(Boolean).join('\n')

        sendWhaapyMessage(integration.config as { api_key: string; phone_id: string }, {
          phone: client.phone_normalized,
          message,
        }).catch(err => console.error('[notification] WhatsApp failed:', err))
      }
    }
  } catch (error) {
    console.error('[notification] sendBookingConfirmation failed:', error)
  }
}

/**
 * Send reminder notification.
 */
export async function sendReminder(
  supabase: SupabaseClient,
  appointmentId: string,
  type: '24h' | '1h' = '24h'
): Promise<void> {
  try {
    const { data: appointment } = await supabase
      .from('appointments')
      .select('id, start_time, organization_id, professional_id, service_id, client_id')
      .eq('id', appointmentId)
      .single()

    if (!appointment) return

    const [orgResult, profResult, svcResult, clientResult] = await Promise.all([
      supabase.from('organizations').select('name, timezone').eq('id', appointment.organization_id).single(),
      supabase.from('professionals').select('display_name').eq('id', appointment.professional_id).single(),
      supabase.from('services').select('name').eq('id', appointment.service_id).single(),
      supabase.from('clients').select('name, email, phone_normalized').eq('id', appointment.client_id).single(),
    ])

    const org = orgResult.data
    const client = clientResult.data
    if (!org || !client) return

    const timezone = org.timezone || 'America/Mexico_City'
    const zonedDate = toZonedTime(new Date(appointment.start_time), timezone)
    const dateStr = format(zonedDate, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })

    const subject = type === '24h' ? 'Recordatorio: tu cita es mañana' : 'Recordatorio: tu cita es en 1 hora'

    if (resend && client.email) {
      resend.emails.send({
        from: `${org.name} <noreply@resend.dev>`,
        to: client.email,
        subject,
        html: `<p>Hola ${client.name},</p><p>Te recordamos tu cita de <strong>${svcResult.data?.name}</strong> con ${profResult.data?.display_name}: ${dateStr}.</p><p>¡Te esperamos!</p>`,
      }).catch(err => console.error('[notification] Reminder email failed:', err))
    }

    if (client.phone_normalized) {
      const { data: integration } = await supabase
        .from('integrations')
        .select('config, is_active')
        .eq('organization_id', appointment.organization_id)
        .eq('type', 'whatsapp')
        .eq('is_active', true)
        .single()

      if (integration) {
        sendWhaapyMessage(integration.config as { api_key: string; phone_id: string }, {
          phone: client.phone_normalized,
          message: `Hola ${client.name}, te recordamos tu cita de ${svcResult.data?.name} con ${profResult.data?.display_name}: ${dateStr}. ¡Te esperamos!`,
        }).catch(err => console.error('[notification] Reminder WhatsApp failed:', err))
      }
    }
  } catch (error) {
    console.error('[notification] sendReminder failed:', error)
  }
}

// ============================================================
// Email HTML builder (simple, no React Email dependency needed at runtime)
// ============================================================

function buildConfirmationEmail(params: {
  clientName: string
  serviceName: string
  professionalName: string
  dateStr: string
  meetUrl: string | null
  orgName: string
}): string {
  return `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="font-size: 20px; font-weight: 500; color: #0F172A; margin: 0 0 8px;">
        ¡Cita confirmada!
      </h2>
      <p style="font-size: 14px; color: #475569; margin: 0 0 24px;">
        Hola ${params.clientName}, tu cita ha sido confirmada.
      </p>
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px;">
        <p style="font-size: 14px; color: #0F172A; margin: 0 0 4px;"><strong>${params.serviceName}</strong></p>
        <p style="font-size: 13px; color: #475569; margin: 0 0 4px;">con ${params.professionalName}</p>
        <p style="font-size: 13px; color: #475569; margin: 0;">${params.dateStr}</p>
        ${params.meetUrl ? `<p style="margin: 12px 0 0;"><a href="${params.meetUrl}" style="color: #00B8E6; font-size: 13px;">Unirse a videollamada</a></p>` : ''}
      </div>
      <p style="font-size: 12px; color: #94A3B8; margin: 24px 0 0;">
        ${params.orgName}
      </p>
    </div>
  `
}
