import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { handleApiError, AppError } from '@/lib/errors'

interface ScheduleSlot {
  day_of_week: number
  start_time: string
  end_time: string
}

interface ProfessionalScheduleInput {
  professional_id: string
  slots: ScheduleSlot[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    const orgId = user.app_metadata?.organization_id
    if (!orgId) throw new AppError('NO_ORG', 'Complete step 1 first', 400)

    const { schedules } = await request.json() as { schedules: ProfessionalScheduleInput[] }
    if (!schedules?.length) throw new AppError('VALIDATION_ERROR', 'Al menos un horario es requerido', 400)

    const admin = createSupabaseAdminClient()

    const rows = schedules.flatMap(ps =>
      ps.slots.map(slot => ({
        professional_id: ps.professional_id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_active: true,
      }))
    )

    if (rows.length === 0) throw new AppError('VALIDATION_ERROR', 'No schedule slots provided', 400)

    const { error: schedError } = await admin
      .from('professional_schedules')
      .insert(rows)

    if (schedError) throw schedError

    return NextResponse.json({ data: { count: rows.length } })
  } catch (error) {
    return handleApiError(error)
  }
}
