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
      .from('services')
      .select('*, service_categories(id, name)')
      .eq('organization_id', orgId)
      .order('sort_order')

    if (error) throw error
    return NextResponse.json({ data: { services: data } })
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
    const { data, error } = await supabase
      .from('services')
      .insert({
        organization_id: orgId,
        name: body.name,
        description: body.description || null,
        duration_minutes: body.duration_minutes || 30,
        buffer_after_minutes: body.buffer_after_minutes || 0,
        price: body.price || 0,
        currency: body.currency || 'MXN',
        requires_payment: body.requires_payment || false,
        is_virtual: body.is_virtual || false,
        category_id: body.category_id || null,
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ data: { service: data } }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
