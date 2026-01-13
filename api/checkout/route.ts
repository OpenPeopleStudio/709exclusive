import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { stripe } from '@/lib/stripe'
import type { CartItem } from '@/types/cart'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { items }: { items: CartItem[] } = await req.json()
  if (!items?.length) return NextResponse.json({ error: 'Empty cart' }, { status: 400 })

  // 1. Fetch variants with FOR UPDATE semantics
  const variantIds = items.map(i => i.variant_id)

  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('id, price_cents, stock, reserved')
    .in('id', variantIds)

  if (error || !variants) {
    return NextResponse.json({ error: 'Inventory fetch failed' }, { status: 500 })
  }

  // 2. Validate availability
  let total = 0

  for (const item of items) {
    const variant = variants.find(v => v.id === item.variant_id)
    if (!variant) return NextResponse.json({ error: 'Variant missing' }, { status: 400 })

    const available = variant.stock - variant.reserved
    if (available < item.qty) {
      return NextResponse.json({
        error: 'Insufficient stock',
        variant_id: variant.id
      }, { status: 409 })
    }

    total += variant.price_cents * item.qty
  }

  // 3. Reserve inventory (atomic update)
  for (const item of items) {
    const { error } = await supabase.rpc('reserve_inventory', {
      variant_id_input: item.variant_id,
      qty_input: item.qty
    })

    if (error) {
      return NextResponse.json({ error: 'Reservation failed' }, { status: 409 })
    }
  }

  // 4. Create order
  const { data: order } = await supabase
    .from('orders')
    .insert({
      customer_id: user.id,
      status: 'pending',
      total_cents: total
    })
    .select()
    .single()

  // 5. Create Stripe intent
  const intent = await stripe.paymentIntents.create({
    amount: total,
    currency: 'cad',
    metadata: { order_id: order.id }
  })

  await supabase
    .from('orders')
    .update({ stripe_payment_intent: intent.id })
    .eq('id', order.id)

  return NextResponse.json({
    clientSecret: intent.client_secret,
    orderId: order.id
  })
}