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
    const allowed = ['name', 'description', 'duration_minutes', 'buffer_after_minutes', 'price', 'currency', 'requires_payment', 'is_virtual', 'is_active', 'category_id', 'sort_order']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', params.id)
      .eq('organization_id', orgId)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ data: { service: data } })
  } catch (error) {
    return handleApiError(error)
  }
}
