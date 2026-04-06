import { createHmac } from 'crypto'

export const WEBHOOK_SIGNATURE_HEADER = 'x-webhook-signature'

export function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}
