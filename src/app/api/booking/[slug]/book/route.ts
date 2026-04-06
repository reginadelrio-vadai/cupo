import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { resolveOrg } from '@/lib/booking/resolve-org'
import { findOrCreateClient } from '@/lib/services/client.service'
import { createBooking } from '@/lib/services/appointment.service'
import { handleApiError, AppError } from '@/lib/errors'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const resolved = await resolveOrg(params.slug)
    if (!resolved) throw new AppError('NOT_FOUND', 'Página no disponible', 404)

    const body = await request.json()
    const { service_id, professional_id, start_time, client: clientData, notes } = body

    if (!service_id || !professional_id || !start_time) {
      throw new AppError('VALIDATION_ERROR', 'service_id, professional_id and start_time are required', 400)
    }

    if (!clientData?.full_name || !clientData?.phone) {
      throw new AppError('VALIDATION_ERROR', 'client.full_name and client.phone are required', 400)
    }

    const supabase = createSupabaseAdminClient()

    // 1. Find or create client — SAME service as agent
    const { client, isNew } = await findOrCreateClient(supabase, resolved.org.id, {
      fullName: clientData.full_name,
      phone: clientData.phone,
      email: clientData.email,
      source: 'booking_page',
    })

    // 2. Create booking — SAME service as agent
    const result = await createBooking(supabase, {
      organizationId: resolved.org.id,
      serviceId: service_id,
      professionalId: professional_id,
      clientId: client.id as string,
      startTime: start_time,
      notes,
      source: 'booking_page',
    })

    return NextResponse.json(
      {
        data: {
          appointment: result.appointment,
          client: { ...client, is_new: isNew },
          requires_payment: result.requiresPayment,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
