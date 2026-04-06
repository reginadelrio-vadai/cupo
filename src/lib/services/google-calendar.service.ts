import { SupabaseClient } from '@supabase/supabase-js'
import { encrypt, decrypt } from '@/lib/encryption'
import { refreshAccessToken, getCalendarClient } from '@/lib/google/calendar'

/**
 * Create Google Calendar event for an appointment.
 * Creates Google Meet if service is virtual.
 * NEVER blocks appointment creation — all errors are caught.
 */
export async function createEventForAppointment(
  supabase: SupabaseClient,
  appointmentId: string
): Promise<{ eventId: string; meetLink?: string } | null> {
  try {
    const { data: appointment } = await supabase
      .from('appointments')
      .select('id, start_time, end_time, notes, professional_id, service_id, client_id')
      .eq('id', appointmentId)
      .single()

    if (!appointment) return null

    const { data: professional } = await supabase
      .from('professionals')
      .select('id, display_name, google_connected, google_refresh_token_encrypted, google_calendar_id')
      .eq('id', appointment.professional_id)
      .single()

    if (!professional?.google_connected || !professional.google_refresh_token_encrypted) return null

    const { data: service } = await supabase
      .from('services')
      .select('name, is_virtual')
      .eq('id', appointment.service_id)
      .single()

    const { data: client } = await supabase
      .from('clients')
      .select('name')
      .eq('id', appointment.client_id)
      .single()

    // Refresh tokens
    const refreshToken = decrypt(professional.google_refresh_token_encrypted)
    const credentials = await refreshAccessToken(refreshToken)

    if (!credentials?.access_token) {
      // Token revoked — mark disconnected
      await supabase.from('professionals').update({ google_connected: false }).eq('id', professional.id)
      return null
    }

    // Save refreshed token if we got a new one
    if (credentials.refresh_token) {
      await supabase.from('professionals').update({
        google_refresh_token_encrypted: encrypt(credentials.refresh_token),
      }).eq('id', professional.id)
    }

    const calendar = getCalendarClient(credentials.access_token)
    if (!calendar) return null

    const calendarId = professional.google_calendar_id || 'primary'

    // Build event
    const eventBody: Record<string, unknown> = {
      summary: `${service?.name || 'Cita'} - ${client?.name || 'Cliente'}`,
      start: { dateTime: appointment.start_time },
      end: { dateTime: appointment.end_time },
      description: appointment.notes || '',
      extendedProperties: {
        private: { platform: 'true' }, // Tag to skip on reverse sync
      },
    }

    // If virtual → create with Google Meet
    if (service?.is_virtual) {
      eventBody.conferenceData = {
        createRequest: {
          requestId: appointment.id,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      }
    }

    const event = await calendar.events.insert({
      calendarId,
      requestBody: eventBody as never,
      conferenceDataVersion: service?.is_virtual ? 1 : 0,
    })

    const meetLink = (event.data.conferenceData as Record<string, unknown[]> | undefined)
      ?.entryPoints?.[0] as Record<string, string> | undefined

    // Save event ID and meet link
    const updates: Record<string, unknown> = { google_event_id: event.data.id }
    if (meetLink?.uri) updates.google_meet_url = meetLink.uri

    await supabase.from('appointments').update(updates).eq('id', appointmentId)

    return { eventId: event.data.id!, meetLink: meetLink?.uri }
  } catch (error) {
    // Google errors NEVER block appointment operations
    console.error('[google-calendar] Event creation failed (non-blocking):', error)
    return null
  }
}

/**
 * Delete Google Calendar event.
 */
export async function deleteEvent(
  supabase: SupabaseClient,
  appointmentId: string
): Promise<void> {
  try {
    const { data: appointment } = await supabase
      .from('appointments')
      .select('google_event_id, professional_id')
      .eq('id', appointmentId)
      .single()

    if (!appointment?.google_event_id) return

    const { data: professional } = await supabase
      .from('professionals')
      .select('google_connected, google_refresh_token_encrypted, google_calendar_id')
      .eq('id', appointment.professional_id)
      .single()

    if (!professional?.google_connected || !professional.google_refresh_token_encrypted) return

    const refreshToken = decrypt(professional.google_refresh_token_encrypted)
    const credentials = await refreshAccessToken(refreshToken)
    if (!credentials?.access_token) return

    const calendar = getCalendarClient(credentials.access_token)
    if (!calendar) return

    await calendar.events.delete({
      calendarId: professional.google_calendar_id || 'primary',
      eventId: appointment.google_event_id,
    })

    await supabase.from('appointments').update({
      google_event_id: null,
      google_meet_url: null,
    }).eq('id', appointmentId)
  } catch (error) {
    console.error('[google-calendar] Event deletion failed (non-blocking):', error)
  }
}
