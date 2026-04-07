import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { handleApiError, AppError } from '@/lib/errors'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    const body = await request.json()

    const { data, error } = await supabase
      .from('professional_schedule_exceptions')
      .insert({
        professional_id: params.id,
        exception_date: body.exception_date,
        is_available: body.is_available ?? false,
        start_time: body.start_time || null,
        end_time: body.end_time || null,
        reason: body.reason || null,
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ data: { exception: data } }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    const { searchParams } = new URL(request.url)
    const exceptionId = searchParams.get('exception_id')
    if (!exceptionId) throw new AppError('VALIDATION_ERROR', 'exception_id required', 400)

    await supabase.from('professional_schedule_exceptions').delete().eq('id', exceptionId)
    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    return handleApiError(error)
  }
}
