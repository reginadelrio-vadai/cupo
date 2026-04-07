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

    const [profResult, schedulesResult, exceptionsResult] = await Promise.all([
      supabase.from('professionals')
        .select('*, professional_services(service_id, services(id, name))')
        .eq('id', params.id).eq('organization_id', orgId).single(),
      supabase.from('professional_schedules')
        .select('*')
        .eq('professional_id', params.id).eq('is_active', true)
        .order('day_of_week'),
      supabase.from('professional_schedule_exceptions')
        .select('*')
        .eq('professional_id', params.id)
        .gte('exception_date', new Date().toISOString().split('T')[0])
        .order('exception_date'),
    ])

    if (!profResult.data) throw new AppError('NOT_FOUND', 'Profesional no encontrado', 404)

    return NextResponse.json({
      data: {
        professional: profResult.data,
        schedules: schedulesResult.data || [],
        exceptions: exceptionsResult.data || [],
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

    // Update professional info
    const allowed = ['display_name', 'email', 'phone', 'is_active']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('professionals').update(updates)
        .eq('id', params.id).eq('organization_id', orgId)
    }

    // Update service links if provided
    if (body.service_ids !== undefined) {
      await supabase.from('professional_services')
        .delete().eq('professional_id', params.id)

      if (body.service_ids.length > 0) {
        await supabase.from('professional_services').insert(
          body.service_ids.map((sid: string) => ({
            organization_id: orgId,
            professional_id: params.id,
            service_id: sid,
          }))
        )
      }
    }

    const { data } = await supabase.from('professionals')
      .select('*, professional_services(service_id, services(id, name))')
      .eq('id', params.id).single()

    return NextResponse.json({ data: { professional: data } })
  } catch (error) {
    return handleApiError(error)
  }
}
