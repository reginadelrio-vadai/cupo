import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
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

    const body = await request.json()
    const allowed = ['name', 'url', 'events', 'secret', 'is_active']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .update(updates)
      .eq('id', params.id)
      .eq('organization_id', orgId)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ data: { endpoint: data } })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)
    const orgId = user.app_metadata?.organization_id

    await supabase.from('webhook_endpoints').delete().eq('id', params.id).eq('organization_id', orgId)
    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    return handleApiError(error)
  }
}
