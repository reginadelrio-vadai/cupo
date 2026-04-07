import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { handleApiError, AppError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)
    const orgId = user.app_metadata?.organization_id

    const { searchParams } = new URL(request.url)
    const endpointId = searchParams.get('endpoint_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('webhook_logs')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (endpointId) query = query.eq('endpoint_id', endpointId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data: { logs: data } })
  } catch (error) {
    return handleApiError(error)
  }
}
