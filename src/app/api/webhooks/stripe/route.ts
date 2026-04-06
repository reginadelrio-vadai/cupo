import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { confirmPayment } from '@/lib/services/payment.service'
import type Stripe from 'stripe'

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: Request) {
  try {
    // ALWAYS req.text(), NEVER req.json() (patrón Menna)
    const rawBody = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature || !STRIPE_WEBHOOK_SECRET) {
      return new NextResponse('Missing signature or webhook secret', { status: 400 })
    }

    let event: Stripe.Event
    try {
      const stripe = getStripe()
      event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
    } catch {
      return new NextResponse('Invalid signature', { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (!session.metadata?.appointment_id || !session.metadata?.organization_id) break

        await confirmPayment(supabase, event.id, session.id, {
          appointment_id: session.metadata.appointment_id,
          organization_id: session.metadata.organization_id,
        })
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        if (!session.metadata?.appointment_id) break

        // Fast-path: expire the appointment (cron also handles this)
        await supabase
          .from('appointments')
          .update({ status: 'expired' })
          .eq('id', session.metadata.appointment_id)
          .eq('status', 'pending_payment')

        break
      }
    }

    // Patrón Menna: ALWAYS return 200 to avoid retry storms
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[stripe-webhook] Error:', error)
    // Still return 200 to prevent infinite retries
    return new NextResponse('OK', { status: 200 })
  }
}
