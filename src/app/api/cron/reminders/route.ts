import { NextRequest, NextResponse } from 'next/server'
import { addMinutes } from 'date-fns'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { sendReminder } from '@/lib/services/notification.service'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization')
    if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const supabase = createSupabaseAdminClient()
    const now = new Date()
    let sent24h = 0
    let sent2h = 0

    // ── 24H REMINDERS ──
    // Window: appointments between now+23h45m and now+24h15m (covers 15min cron interval)
    const from24h = addMinutes(now, 23 * 60 + 45).toISOString()
    const to24h = addMinutes(now, 24 * 60 + 15).toISOString()

    const { data: reminders24 } = await supabase
      .from('appointments')
      .select('id, organization_id')
      .in('status', ['confirmed'])
      .eq('reminder_24h_sent', false)
      .gte('start_time', from24h)
      .lte('start_time', to24h)

    for (const appt of reminders24 || []) {
      await sendReminder(supabase, appt.id, '24h')

      await supabase
        .from('appointments')
        .update({ reminder_24h_sent: true })
        .eq('id', appt.id)

      sent24h++
    }

    // ── 2H REMINDERS ──
    // Window: appointments between now+1h45m and now+2h15m
    const from2h = addMinutes(now, 105).toISOString()
    const to2h = addMinutes(now, 135).toISOString()

    const { data: reminders2 } = await supabase
      .from('appointments')
      .select('id, organization_id')
      .in('status', ['confirmed'])
      .eq('reminder_2h_sent', false)
      .gte('start_time', from2h)
      .lte('start_time', to2h)

    for (const appt of reminders2 || []) {
      await sendReminder(supabase, appt.id, '1h')

      await supabase
        .from('appointments')
        .update({ reminder_2h_sent: true })
        .eq('id', appt.id)

      sent2h++
    }

    return NextResponse.json({ data: { sent_24h: sent24h, sent_2h: sent2h } })
  } catch (error) {
    console.error('[cron] reminders error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
