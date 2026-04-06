import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createBooking } from '@/lib/services/appointment.service'
import { findOrCreateClient } from '@/lib/services/client.service'
import { handleApiError, AppError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    const orgId = user.app_metadata?.organization_id
    if (!orgId) throw new AppError('NO_ORG', 'No organization', 400)

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const professionalId = searchParams.get('professional_id')

    if (!start || !end) throw new AppError('VALIDATION_ERROR', 'start and end are required', 400)

    let query = supabase
      .from('appointments')
      .select('id, start_time, end_time, status, source, notes, cancellation_reason, services(id, name, duration_minutes, price, currency), professionals(id, display_name), clients(id, name, phone, email)')
      .eq('organization_id', orgId)
      .gte('start_time', start)
      .lt('start_time', end)
      .order('start_time')

    if (professionalId) query = query.eq('professional_id', professionalId)

    const { data: appointments, error } = await query
    if (error) throw error

    return NextResponse.json({ data: { appointments } })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    const orgId = user.app_metadata?.organization_id
    if (!orgId) throw new AppError('NO_ORG', 'No organization', 400)

    const body = await request.json()
    const { service_id, professional_id, start_time, client: clientData, notes } = body

    if (!service_id || !professional_id || !start_time || !clientData?.name || !clientData?.phone) {
      throw new AppError('VALIDATION_ERROR', 'Missing required fields', 400)
    }

    const admin = createSupabaseAdminClient()

    const { client } = await findOrCreateClient(admin, orgId, {
      fullName: clientData.name,
      phone: clientData.phone,
      email: clientData.email,
      source: 'manual',
    })

    const result = await createBooking(admin, {
      organizationId: orgId,
      serviceId: service_id,
      professionalId: professional_id,
      clientId: client.id as string,
      startTime: start_time,
      notes,
      source: 'manual',
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
