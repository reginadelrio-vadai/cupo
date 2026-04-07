import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { handleApiError, AppError } from '@/lib/errors'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)
    const orgId = user.app_metadata?.organization_id

    const { data, error } = await supabase
      .from('professionals')
      .select('*, professional_services(service_id, services(id, name))')
      .eq('organization_id', orgId)
      .order('display_name')

    if (error) throw error
    return NextResponse.json({ data: { professionals: data } })
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

    const body = await request.json()
    if (!body.display_name) throw new AppError('VALIDATION_ERROR', 'Name is required', 400)

    const { data: prof, error } = await supabase
      .from('professionals')
      .insert({
        organization_id: orgId,
        display_name: body.display_name,
        email: body.email || null,
        phone: body.phone || null,
      })
      .select('*')
      .single()

    if (error) throw error

    // Link services
    if (body.service_ids?.length) {
      await supabase.from('professional_services').insert(
        body.service_ids.map((sid: string) => ({
          organization_id: orgId,
          professional_id: prof.id,
          service_id: sid,
        }))
      )
    }

    return NextResponse.json({ data: { professional: prof } }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
