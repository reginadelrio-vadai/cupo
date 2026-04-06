import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'

interface AuthResult {
  organizationId: string
}

/**
 * Authenticate agent request via X-Agent-Key header.
 * Returns organizationId or a NextResponse error.
 */
export async function authenticateAgent(
  request: Request
): Promise<AuthResult | NextResponse> {
  const apiKey = request.headers.get('x-agent-key')
  if (!apiKey) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Missing X-Agent-Key header' },
      { status: 401 }
    )
  }

  const supabase = createSupabaseAdminClient()
  const keyHash = createHash('sha256').update(apiKey).digest('hex')

  const { data: key, error } = await supabase
    .from('api_keys')
    .select('organization_id, key_prefix, is_active')
    .eq('key_hash', keyHash)
    .single()

  if (error || !key) {
    return NextResponse.json(
      { error: 'INVALID_API_KEY', message: 'Invalid API key' },
      { status: 401 }
    )
  }

  if (!key.is_active) {
    return NextResponse.json(
      { error: 'API_KEY_DISABLED', message: 'API key is disabled' },
      { status: 403 }
    )
  }

  // Rate limit (graceful degradation — patrón Menna)
  const { allowed } = await checkRateLimit(key.key_prefix)
  if (!allowed) {
    return NextResponse.json(
      { error: 'RATE_LIMITED', message: 'Too many requests. Limit: 120/min' },
      { status: 429 }
    )
  }

  // Subscription check
  const { data: sub } = await supabase
    .from('organization_subscriptions')
    .select('status')
    .eq('organization_id', key.organization_id)
    .in('status', ['active', 'trialing'])
    .single()

  if (!sub) {
    return NextResponse.json(
      { error: 'SUBSCRIPTION_INACTIVE', message: 'Organization subscription is not active' },
      { status: 403 }
    )
  }

  // Update last_used_at (fire-and-forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash)
    .then(() => {})

  return { organizationId: key.organization_id }
}

/** Type guard to check if auth result is an error response */
export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}
