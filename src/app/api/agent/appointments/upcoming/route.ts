import { NextRequest, NextResponse } from 'next/server'
import { authenticateAgent, isAuthError } from '@/lib/agent-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { handleApiError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAgent(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')
    const professionalId = searchParams.get('professional_id')
    const limit = parseInt(searchParams.get('limit') || '20')

    const supabase = createSupabaseAdminClient()

    let query = supabase
      .from('appointments')
      .select('*, services(name, duration_minutes, price), professionals(display_name), clients(name, phone)')
      .eq('organization_id', auth.organizationId)
      .in('status', ['confirmed', 'pending_payment'])
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(limit)

    if (clientId) query = query.eq('client_id', clientId)
    if (professionalId) query = query.eq('professional_id', professionalId)

    const { data: appointments, error } = await query

    if (error) throw error

    return NextResponse.json({ data: { appointments } })
  } catch (error) {
    return handleApiError(error)
  }
}
