import { NextRequest, NextResponse } from 'next/server'
import { authenticateAgent, isAuthError } from '@/lib/agent-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { handleApiError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAgent(request)
    if (isAuthError(auth)) return auth

    const supabase = createSupabaseAdminClient()
    const { data: professionals, error } = await supabase
      .from('professionals')
      .select('id, display_name, email, avatar_url, professional_services(service_id, services(id, name))')
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)

    if (error) throw error

    return NextResponse.json({ data: { professionals } })
  } catch (error) {
    return handleApiError(error)
  }
}
