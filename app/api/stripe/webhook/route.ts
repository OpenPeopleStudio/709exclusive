import { stripe } from '@/lib/stripe'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { headers } from 'next/headers'
import { sendOrderConfirmation } from '@/lib/email'

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) {
    return new Response('Missing stripe signature', { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Stripe webhook signature error:', error)
    return new Response('Invalid signature', { status: 400 })
  }

  const supabase = await createSupabaseServer()

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object

    const { data: order } = await supabase
      .from('orders')
      .select('id, status')
      .eq('stripe_payment_intent', intent.id)
      .single()

    // Idempotency: only process if not already paid
    if (order && order.status === 'pending') {
      const { data: items } = await supabase
        .from('order_items')
        .select('variant_id, qty')
        .eq('order_id', order.id)

      if (items) {
        for (const item of items) {
          await supabase.rpc('finalize_inventory', {
            variant_id_input: item.variant_id,
            qty_input: item.qty
          })
        }
      }

      await supabase
        .from('orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', order.id)

      // Trigger order confirmation email
      await sendOrderConfirmation(order.id)
    }
  } else if (event.type === 'payment_intent.payment_failed' ||
             event.type === 'payment_intent.canceled') {
    const intent = event.data.object

    // Get order and release reserved inventory
    const { data: order } = await supabase
      .from('orders')
      .select('id, status')
      .eq('stripe_payment_intent', intent.id)
      .single()

    if (order && order.status === 'pending') {
      // Get order items and release reservations
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('variant_id, qty')
        .eq('order_id', order.id)

      if (orderItems) {
        for (const item of orderItems) {
          await supabase.rpc('release_reserved_inventory', {
            variant_id: item.variant_id,
            qty: item.qty
          })
        }
      }

      // Update order status
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', order.id)
    }
  }

  return new Response('ok')
}
