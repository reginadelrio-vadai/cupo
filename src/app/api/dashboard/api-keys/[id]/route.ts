import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { handleApiError, AppError } from '@/lib/errors'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)
    const orgId = user.app_metadata?.organization_id

    await supabase.from('api_keys').delete().eq('id', params.id).eq('organization_id', orgId)
    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    return handleApiError(error)
  }
}
