import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import {
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
  markNoShow,
} from '@/lib/services/appointment.service'
import { handleApiError, AppError } from '@/lib/errors'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    const orgId = user.app_metadata?.organization_id
    if (!orgId) throw new AppError('NO_ORG', 'No organization', 400)

    const body = await request.json()
    const admin = createSupabaseAdminClient()

    if (body.status === 'cancelled') {
      const updated = await cancelAppointment(admin, orgId, params.id, 'dashboard', body.cancellation_reason)
      return NextResponse.json({ data: { appointment: updated } })
    }

    if (body.status === 'completed') {
      const updated = await completeAppointment(admin, orgId, params.id, 'dashboard')
      return NextResponse.json({ data: { appointment: updated } })
    }

    if (body.status === 'no_show') {
      const updated = await markNoShow(admin, orgId, params.id, 'dashboard')
      return NextResponse.json({ data: { appointment: updated } })
    }

    if (body.start_time) {
      const updated = await rescheduleAppointment(admin, orgId, params.id, body.start_time, 'dashboard')
      return NextResponse.json({ data: { appointment: updated } })
    }

    throw new AppError('VALIDATION_ERROR', 'No valid action specified', 400)
  } catch (error) {
    return handleApiError(error)
  }
}
