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
      .from('service_categories')
      .select('*')
      .eq('organization_id', orgId)
      .order('sort_order')

    if (error) throw error
    return NextResponse.json({ data: { categories: data } })
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

    const { name } = await request.json()
    if (!name) throw new AppError('VALIDATION_ERROR', 'Name is required', 400)

    const { data, error } = await supabase
      .from('service_categories')
      .insert({ organization_id: orgId, name })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ data: { category: data } }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
