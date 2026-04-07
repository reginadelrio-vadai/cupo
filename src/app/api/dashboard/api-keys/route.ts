import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createHash, randomBytes } from 'crypto'
import { handleApiError, AppError } from '@/lib/errors'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)
    const orgId = user.app_metadata?.organization_id

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, is_active, last_used_at, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data: { keys: data } })
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
    const name = body.name || 'Default'

    // Generate API key
    const rawKey = `cupo_${randomBytes(32).toString('hex')}`
    const keyHash = createHash('sha256').update(rawKey).digest('hex')
    const keyPrefix = rawKey.slice(0, 12)

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        organization_id: orgId,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes: ['agent'],
      })
      .select('id, name, key_prefix, is_active, created_at')
      .single()

    if (error) throw error

    // Return the raw key ONCE — it cannot be retrieved again
    return NextResponse.json({
      data: {
        key: data,
        raw_key: rawKey, // Show only once
      },
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
