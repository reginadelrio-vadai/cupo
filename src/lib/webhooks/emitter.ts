import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { signPayload, WEBHOOK_SIGNATURE_HEADER } from './signer'

interface EmitOptions {
  organizationId: string
  eventType: string
  payload: Record<string, unknown>
}

export async function emitWebhook({ organizationId, eventType, payload }: EmitOptions) {
  const supabase = createSupabaseAdminClient()

  // Find active endpoints subscribed to this event
  const { data: endpoints } = await supabase
    .from('webhook_endpoints')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .contains('events', [eventType])

  if (!endpoints?.length) return

  for (const endpoint of endpoints) {
    const body = JSON.stringify({ event: eventType, data: payload, timestamp: new Date().toISOString() })

    // Create log entry
    const { data: log } = await supabase
      .from('webhook_logs')
      .insert({
        organization_id: organizationId,
        endpoint_id: endpoint.id,
        event_type: eventType,
        payload,
        target_url: endpoint.url,
        status: 'pending',
      })
      .select('id')
      .single()

    // Deliver
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (endpoint.secret) {
      headers[WEBHOOK_SIGNATURE_HEADER] = signPayload(body, endpoint.secret)
    }

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10000),
      })

      await supabase
        .from('webhook_logs')
        .update({
          status: response.ok ? 'delivered' : 'failed',
          response_code: response.status,
          response_body: await response.text().catch(() => null),
          attempt_count: 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', log?.id)
    } catch (err) {
      await supabase
        .from('webhook_logs')
        .update({
          status: 'failed',
          response_body: err instanceof Error ? err.message : 'Unknown error',
          attempt_count: 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', log?.id)
    }
  }
}
