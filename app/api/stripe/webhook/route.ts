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
      .select('id, status, tenant_id')
      .eq('stripe_payment_intent', intent.id)
      .single()

    // Idempotency: only process if not already paid
    if (order && order.status === 'pending') {
      let itemsQuery = supabase
        .from('order_items')
        .select('variant_id, qty')
        .eq('order_id', order.id)
      if (order.tenant_id) {
        itemsQuery = itemsQuery.eq('tenant_id', order.tenant_id)
      }
      const { data: items } = await itemsQuery

      if (items) {
        for (const item of items) {
          await supabase.rpc('finalize_inventory', {
            variant_id_input: item.variant_id,
            qty_input: item.qty
          })
        }
      }

      let updateQuery = supabase
        .from('orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', order.id)
      if (order.tenant_id) {
        updateQuery = updateQuery.eq('tenant_id', order.tenant_id)
      }
      await updateQuery

      // Trigger order confirmation email
      await sendOrderConfirmation(order.id)
    }
  } else if (event.type === 'payment_intent.payment_failed' ||
             event.type === 'payment_intent.canceled') {
    const intent = event.data.object

    // Get order and release reserved inventory
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, tenant_id')
      .eq('stripe_payment_intent', intent.id)
      .single()

    if (order && order.status === 'pending') {
      // Get order items and release reservations
      let itemsQuery = supabase
        .from('order_items')
        .select('variant_id, qty')
        .eq('order_id', order.id)
      if (order.tenant_id) {
        itemsQuery = itemsQuery.eq('tenant_id', order.tenant_id)
      }
      const { data: orderItems } = await itemsQuery

      if (orderItems) {
        for (const item of orderItems) {
          await supabase.rpc('release_reserved_inventory', {
            variant_id: item.variant_id,
            qty: item.qty
          })
        }
      }

      // Update order status
      let updateQuery = supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', order.id)
      if (order.tenant_id) {
        updateQuery = updateQuery.eq('tenant_id', order.tenant_id)
      }
      await updateQuery
    }
  }

  return new Response('ok')
}
