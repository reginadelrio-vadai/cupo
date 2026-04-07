import { SupabaseClient } from '@supabase/supabase-js'
import { addDays } from 'date-fns'
import { decrypt, encrypt } from '@/lib/encryption'
import { refreshAccessToken, getCalendarClient } from '@/lib/google/calendar'
import { randomUUID } from 'crypto'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ============================================================
// isOurEvent — skip platform-created events in reverse sync
// ============================================================

interface GoogleEvent {
  id?: string | null
  status?: string | null
  summary?: string | null
  start?: { dateTime?: string | null; date?: string | null } | null
  end?: { dateTime?: string | null; date?: string | null } | null
  extendedProperties?: { private?: Record<string, string> } | null
}

function isOurEvent(event: GoogleEvent): boolean {
  return event.extendedProperties?.private?.platform === 'true'
}

// ============================================================
// getAuthenticatedCalendar — refresh tokens + get client
// ============================================================

async function getAuthenticatedCalendar(
  supabase: SupabaseClient,
  professional: { id: string; google_refresh_token_encrypted: string }
) {
  const refreshToken = decrypt(professional.google_refresh_token_encrypted)
  const credentials = await refreshAccessToken(refreshToken)

  if (!credentials?.access_token) {
    await supabase.from('professionals').update({ google_connected: false }).eq('id', professional.id)
    return null
  }

  if (credentials.refresh_token) {
    await supabase.from('professionals').update({
      google_refresh_token_encrypted: encrypt(credentials.refresh_token),
    }).eq('id', professional.id)
  }

  return getCalendarClient(credentials.access_token)
}

// ============================================================
// initialCalendarSync — full sync of next 60 days
// ============================================================

export async function initialCalendarSync(
  supabase: SupabaseClient,
  professionalId: string,
  organizationId: string,
  calendarId: string,
  professional: { id: string; google_refresh_token_encrypted: string }
): Promise<number> {
  const calendar = await getAuthenticatedCalendar(supabase, professional)
  if (!calendar) return 0

  const now = new Date()
  const until = addDays(now, 60)

  const events = await calendar.events.list({
    calendarId,
    timeMin: now.toISOString(),
    timeMax: until.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 500,
  })

  let count = 0
  for (const event of (events.data.items || []) as GoogleEvent[]) {
    if (!event.id || event.status === 'cancelled') continue
    if (isOurEvent(event)) continue

    const startTime = event.start?.dateTime || event.start?.date
    const endTime = event.end?.dateTime || event.end?.date
    if (!startTime || !endTime) continue

    await supabase.from('professional_external_events').upsert({
      organization_id: organizationId,
      professional_id: professionalId,
      google_event_id: event.id,
      google_calendar_id: calendarId,
      summary: event.summary || '(Sin título)',
      start_time: startTime,
      end_time: endTime,
      is_all_day: !!event.start?.date && !event.start?.dateTime,
      synced_at: new Date().toISOString(),
    }, { onConflict: 'professional_id,google_event_id' })

    count++
  }

  return count
}

// ============================================================
// incrementalSync — fetch recently changed events
// ============================================================

export async function incrementalSync(
  supabase: SupabaseClient,
  professional: { id: string; organization_id: string; google_refresh_token_encrypted: string },
  calendarId: string
): Promise<void> {
  const calendar = await getAuthenticatedCalendar(supabase, professional)
  if (!calendar) return

  // 24h window to catch any missed changes
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const events = await calendar.events.list({
    calendarId,
    updatedMin: since.toISOString(),
    singleEvents: true,
    maxResults: 250,
    showDeleted: true,
  })

  for (const event of (events.data.items || []) as GoogleEvent[]) {
    if (!event.id) continue
    if (isOurEvent(event)) continue

    if (event.status === 'cancelled') {
      await supabase.from('professional_external_events')
        .delete()
        .eq('professional_id', professional.id)
        .eq('google_event_id', event.id)
      continue
    }

    const startTime = event.start?.dateTime || event.start?.date
    const endTime = event.end?.dateTime || event.end?.date
    if (!startTime || !endTime) continue

    await supabase.from('professional_external_events').upsert({
      organization_id: professional.organization_id,
      professional_id: professional.id,
      google_event_id: event.id,
      google_calendar_id: calendarId,
      summary: event.summary || '(Sin título)',
      start_time: startTime,
      end_time: endTime,
      is_all_day: !!event.start?.date && !event.start?.dateTime,
      status: event.status || 'confirmed',
      synced_at: new Date().toISOString(),
    }, { onConflict: 'professional_id,google_event_id' })
  }
}

// ============================================================
// registerWatchChannel — subscribe to push notifications
// ============================================================

export async function registerWatchChannel(
  supabase: SupabaseClient,
  professionalId: string,
  calendarId: string,
  professional: { id: string; google_refresh_token_encrypted: string }
): Promise<void> {
  const calendar = await getAuthenticatedCalendar(supabase, professional)
  if (!calendar) return

  const channelId = randomUUID()

  try {
    const response = await calendar.events.watch({
      calendarId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: `${APP_URL}/api/webhooks/google-calendar`,
        expiration: String(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    await supabase.from('google_watch_channels').insert({
      professional_id: professionalId,
      channel_id: channelId,
      resource_id: response.data.resourceId || null,
      google_calendar_id: calendarId,
      expires_at: new Date(Number(response.data.expiration)).toISOString(),
    })
  } catch (error) {
    // Watch channel registration failure is non-blocking
    // The daily cron will retry
    console.error('[google-sync] Watch channel registration failed:', error)
  }
}

// ============================================================
// stopWatchChannel — unsubscribe from push notifications
// ============================================================

export async function stopWatchChannel(
  supabase: SupabaseClient,
  channelId: string,
  resourceId: string | null,
  professional: { id: string; google_refresh_token_encrypted: string }
): Promise<void> {
  try {
    const calendar = await getAuthenticatedCalendar(supabase, professional)
    if (calendar && resourceId) {
      await calendar.channels.stop({
        requestBody: { id: channelId, resourceId },
      })
    }
  } catch (error) {
    console.error('[google-sync] Stop channel failed (non-blocking):', error)
  }

  await supabase.from('google_watch_channels')
    .update({ is_active: false })
    .eq('channel_id', channelId)
}

// ============================================================
// disconnectGoogleCalendar — full cleanup
// ============================================================

export async function disconnectGoogleCalendar(
  supabase: SupabaseClient,
  professionalId: string
): Promise<void> {
  const { data: professional } = await supabase
    .from('professionals')
    .select('id, google_refresh_token_encrypted')
    .eq('id', professionalId)
    .single()

  if (!professional) return

  // Stop all active watch channels
  const { data: channels } = await supabase
    .from('google_watch_channels')
    .select('channel_id, resource_id')
    .eq('professional_id', professionalId)
    .eq('is_active', true)

  if (channels && professional.google_refresh_token_encrypted) {
    for (const ch of channels) {
      await stopWatchChannel(supabase, ch.channel_id, ch.resource_id, professional as never)
    }
  }

  // Delete all external events
  await supabase.from('professional_external_events')
    .delete()
    .eq('professional_id', professionalId)

  // Mark disconnected
  await supabase.from('professionals').update({
    google_connected: false,
    google_refresh_token_encrypted: null,
    google_calendar_id: null,
  }).eq('id', professionalId)
}

// ============================================================
// renewExpiringChannels — called by cron
// ============================================================

export async function renewExpiringChannels(supabase: SupabaseClient): Promise<number> {
  // Find channels expiring in the next 48 hours
  const cutoff = new Date(Date.now() + 48 * 60 * 60 * 1000)

  const { data: channels } = await supabase
    .from('google_watch_channels')
    .select('id, professional_id, channel_id, resource_id, google_calendar_id')
    .eq('is_active', true)
    .lt('expires_at', cutoff.toISOString())

  if (!channels?.length) return 0

  let renewed = 0

  for (const ch of channels) {
    const { data: professional } = await supabase
      .from('professionals')
      .select('id, organization_id, google_connected, google_refresh_token_encrypted')
      .eq('id', ch.professional_id)
      .single()

    if (!professional?.google_connected || !professional.google_refresh_token_encrypted) {
      await supabase.from('google_watch_channels').update({ is_active: false }).eq('id', ch.id)
      continue
    }

    // Stop old channel
    await stopWatchChannel(supabase, ch.channel_id, ch.resource_id, professional as never)

    // Register new channel
    await registerWatchChannel(supabase, ch.professional_id, ch.google_calendar_id, professional as never)

    // Full sync as safety net
    await initialCalendarSync(
      supabase,
      ch.professional_id,
      professional.organization_id,
      ch.google_calendar_id,
      professional as never
    )

    renewed++
  }

  return renewed
}
