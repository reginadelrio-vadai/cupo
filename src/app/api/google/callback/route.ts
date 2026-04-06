import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getTokensFromCode } from '@/lib/google/calendar'
import { encrypt } from '@/lib/encryption'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const stateParam = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${APP_URL}/settings?google=error&reason=${error}`)
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(`${APP_URL}/settings?google=error&reason=missing_params`)
    }

    const state = JSON.parse(stateParam) as { professional_id: string; organization_id: string }

    const tokens = await getTokensFromCode(code)
    if (!tokens?.refresh_token) {
      return NextResponse.redirect(`${APP_URL}/settings?google=error&reason=no_refresh_token`)
    }

    const supabase = createSupabaseAdminClient()

    // Save encrypted refresh token
    await supabase.from('professionals').update({
      google_connected: true,
      google_refresh_token_encrypted: encrypt(tokens.refresh_token),
      google_calendar_id: 'primary',
    }).eq('id', state.professional_id).eq('organization_id', state.organization_id)

    return NextResponse.redirect(`${APP_URL}/settings?google=success`)
  } catch (err) {
    console.error('[google-callback] Error:', err)
    return NextResponse.redirect(`${APP_URL}/settings?google=error&reason=unknown`)
  }
}
