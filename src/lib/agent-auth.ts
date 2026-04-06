import { createHash } from 'crypto'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { AppError } from '@/lib/errors'

/**
 * Verify agent API key from X-Agent-Key header.
 * Returns organization_id if valid.
 */
export async function verifyAgentKey(apiKey: string): Promise<string> {
  const supabase = createSupabaseAdminClient()
  const keyHash = createHash('sha256').update(apiKey).digest('hex')

  const { data: key, error } = await supabase
    .from('api_keys')
    .select('organization_id, is_active, scopes')
    .eq('key_hash', keyHash)
    .single()

  if (error || !key) {
    throw new AppError('INVALID_API_KEY', 'Invalid API key', 401)
  }

  if (!key.is_active) {
    throw new AppError('API_KEY_DISABLED', 'API key is disabled', 403)
  }

  // Check subscription is active
  const { data: sub } = await supabase
    .from('organization_subscriptions')
    .select('status')
    .eq('organization_id', key.organization_id)
    .in('status', ['active', 'trialing'])
    .single()

  if (!sub) {
    throw new AppError('SUBSCRIPTION_INACTIVE', 'Organization subscription is not active', 403)
  }

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash)

  return key.organization_id
}
