import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization')
    if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const supabase = createSupabaseAdminClient()
    const { data } = await supabase.rpc('expire_unpaid_appointments')

    return NextResponse.json({ data: { expired: data || 0 } })
  } catch (error) {
    console.error('[cron] expire-payments error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
