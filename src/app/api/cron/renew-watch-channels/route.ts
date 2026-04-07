import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { renewExpiringChannels } from '@/lib/services/google-calendar-sync.service'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization')
    if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const supabase = createSupabaseAdminClient()
    const renewed = await renewExpiringChannels(supabase)

    return NextResponse.json({ data: { renewed } })
  } catch (error) {
    console.error('[cron] renew-watch-channels error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
