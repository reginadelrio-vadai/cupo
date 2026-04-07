import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { handleApiError, AppError } from '@/lib/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)
    const orgId = user.app_metadata?.organization_id

    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', params.id)
      .eq('organization_id', orgId)
      .single()

    if (error || !client) throw new AppError('NOT_FOUND', 'Cliente no encontrado', 404)

    // Get appointment history
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, start_time, end_time, status, source, services(name, price, currency), professionals(display_name)')
      .eq('client_id', params.id)
      .eq('organization_id', orgId)
      .order('start_time', { ascending: false })
      .limit(50)

    // Calculate stats
    const totalAppts = appointments?.length || 0
    const completed = appointments?.filter(a => a.status === 'completed').length || 0
    const noShows = appointments?.filter(a => a.status === 'no_show').length || 0

    return NextResponse.json({
      data: {
        client,
        appointments: appointments || [],
        stats: { total_appointments: totalAppts, completed, no_shows: noShows },
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)
    const orgId = user.app_metadata?.organization_id

    const body = await request.json()
    const allowed = ['name', 'email', 'phone', 'notes']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', params.id)
      .eq('organization_id', orgId)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ data: { client: data } })
  } catch (error) {
    return handleApiError(error)
  }
}
