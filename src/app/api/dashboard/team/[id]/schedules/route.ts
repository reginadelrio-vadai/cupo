import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { handleApiError, AppError } from '@/lib/errors'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    const { schedules } = await request.json()

    // Delete existing and replace
    await supabase.from('professional_schedules')
      .delete().eq('professional_id', params.id)

    if (schedules?.length) {
      const rows = schedules.map((s: { day_of_week: number; start_time: string; end_time: string }) => ({
        professional_id: params.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_active: true,
      }))
      await supabase.from('professional_schedules').insert(rows)
    }

    return NextResponse.json({ data: { count: schedules?.length || 0 } })
  } catch (error) {
    return handleApiError(error)
  }
}
