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
      .from('webhook_endpoints')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data: { endpoints: data } })
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
    if (!body.name || !body.url || !body.events?.length) {
      throw new AppError('VALIDATION_ERROR', 'name, url, and events are required', 400)
    }

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .insert({
        organization_id: orgId,
        name: body.name,
        url: body.url,
        events: body.events,
        secret: body.secret || null,
        is_active: true,
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ data: { endpoint: data } }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
