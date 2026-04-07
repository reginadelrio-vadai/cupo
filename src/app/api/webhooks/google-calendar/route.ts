import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { incrementalSync } from '@/lib/services/google-calendar-sync.service'

export async function POST(req: Request) {
  try {
    const channelId = req.headers.get('x-goog-channel-id')
    const resourceState = req.headers.get('x-goog-resource-state')

    if (!channelId) return new NextResponse('OK', { status: 200 })

    // Ignore initial sync notification from Google
    if (resourceState === 'sync') return new NextResponse('OK', { status: 200 })

    const supabase = createSupabaseAdminClient()

    // Find channel and associated professional
    const { data: channel } = await supabase
      .from('google_watch_channels')
      .select('professional_id, google_calendar_id')
      .eq('channel_id', channelId)
      .eq('is_active', true)
      .single()

    if (!channel) return new NextResponse('OK', { status: 200 })

    const { data: professional } = await supabase
      .from('professionals')
      .select('id, organization_id, google_refresh_token_encrypted, google_connected')
      .eq('id', channel.professional_id)
      .single()

    if (!professional?.google_connected || !professional.google_refresh_token_encrypted) {
      return new NextResponse('OK', { status: 200 })
    }

    await incrementalSync(supabase, {
      id: professional.id,
      organization_id: professional.organization_id,
      google_refresh_token_encrypted: professional.google_refresh_token_encrypted,
    }, channel.google_calendar_id)

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[google-webhook] Error:', error)
    // Always return 200 — Google will retry on failure
    return new NextResponse('OK', { status: 200 })
  }
}
