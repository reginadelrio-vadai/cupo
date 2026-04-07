import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { handleApiError, AppError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)
    const orgId = user.app_metadata?.organization_id
    if (!orgId) throw new AppError('NO_ORG', 'No organization', 400)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') === 'asc' ? true : false

    let query = supabase
      .from('clients')
      .select('*')
      .eq('organization_id', orgId)
      .order(sortBy, { ascending: order })
      .limit(100)

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data: { clients: data } })
  } catch (error) {
    return handleApiError(error)
  }
}
