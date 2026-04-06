import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { resolveOrg } from '@/lib/booking/resolve-org'
import { getAvailableSlots } from '@/lib/services/availability.service'
import { handleApiError, AppError } from '@/lib/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const resolved = await resolveOrg(params.slug)
    if (!resolved) throw new AppError('NOT_FOUND', 'Página no disponible', 404)

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const serviceId = searchParams.get('service_id')
    const professionalId = searchParams.get('professional_id') || undefined

    if (!date || !serviceId) {
      throw new AppError('VALIDATION_ERROR', 'date and service_id are required', 400)
    }

    const supabase = createSupabaseAdminClient()
    const slots = await getAvailableSlots(supabase, {
      organizationId: resolved.org.id,
      serviceId,
      professionalId,
      date,
      timezone: resolved.org.timezone,
    })

    return NextResponse.json({
      data: { date, timezone: resolved.org.timezone, slots },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
