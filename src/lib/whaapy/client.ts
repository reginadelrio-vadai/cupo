interface WhaapyConfig {
  api_key: string
  phone_id: string
  base_url?: string
}

interface WhaapyMessage {
  phone: string
  message: string
}

/**
 * Send WhatsApp message via Whaapy API.
 * Fire-and-forget — never blocks the response.
 */
export async function sendWhaapyMessage(config: WhaapyConfig, msg: WhaapyMessage): Promise<void> {
  const baseUrl = config.base_url || 'https://api.whaapy.com'

  await fetch(`${baseUrl}/v1/messages/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.api_key}`,
    },
    body: JSON.stringify({
      phone_id: config.phone_id,
      to: msg.phone,
      type: 'text',
      text: { body: msg.message },
    }),
    signal: AbortSignal.timeout(10000),
  })
}
