import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { createNOWPaymentInvoice } from '@/lib/nowpayments'

// Helper to safely extract product name from Supabase join result
function getProductName(products: unknown): string {
  if (!products) return 'Unknown'
  if (Array.isArray(products) && products[0]?.name) return products[0].name
  if (typeof products === 'object' && (products as { name?: string }).name) {
    return (products as { name: string }).name
  }
  return 'Unknown'
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { items, shippingAddress, email } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }

    if (!shippingAddress || !shippingAddress.name || !shippingAddress.address) {
      return NextResponse.json({ error: 'Shipping address required' }, { status: 400 })
    }

    // Calculate total
    let totalCents = 0
    const orderItems: Array<{
      variant_id: string
      quantity: number
      price_cents: number
      product_name: string
      size: string
    }> = []

    for (const item of items) {
      const { data: variant } = await supabase
        .from('variants')
        .select('id, price_cents, size, products(name)')
        .eq('id', item.variantId)
        .single()

      if (!variant) {
        return NextResponse.json({ error: `Variant not found: ${item.variantId}` }, { status: 400 })
      }

      totalCents += variant.price_cents * item.quantity
      orderItems.push({
        variant_id: variant.id,
        quantity: item.quantity,
        price_cents: variant.price_cents,
        product_name: getProductName(variant.products),
        size: variant.size,
      })
    }

    // Create order in pending state
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: user?.id || null,
        customer_email: email || user?.email,
        status: 'pending',
        total_cents: totalCents,
        payment_method: 'nowpayments',
        shipping_name: shippingAddress.name,
        shipping_address: shippingAddress.address,
        shipping_city: shippingAddress.city,
        shipping_state: shippingAddress.state,
        shipping_zip: shippingAddress.zip,
        shipping_country: shippingAddress.country || 'CA',
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Insert order items
    const itemsToInsert = orderItems.map(item => ({
      order_id: order.id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      price_cents: item.price_cents,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)

    if (itemsError) {
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id)
      console.error('Order items error:', itemsError)
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    // Create product description
    const itemDescriptions = orderItems.map(item => 
      `${item.product_name} (${item.size}) x${item.quantity}`
    ).join(', ')

    // Create NOWPayments invoice
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://709exclusive.shop'
    
    const invoice = await createNOWPaymentInvoice({
      price_amount: totalCents / 100,
      price_currency: 'cad',
      order_id: order.id,
      order_description: itemDescriptions.slice(0, 150), // Max 150 chars
      ipn_callback_url: `${baseUrl}/api/nowpayments/webhook`,
      success_url: `${baseUrl}/checkout/success?order_id=${order.id}`,
      cancel_url: `${baseUrl}/checkout?cancelled=true`,
    })

    // Store invoice ID on order
    await supabase
      .from('orders')
      .update({ 
        nowpayments_invoice_id: invoice.id,
      })
      .eq('id', order.id)

    return NextResponse.json({
      orderId: order.id,
      invoiceId: invoice.id,
      invoiceUrl: invoice.invoice_url,
    })

  } catch (error) {
    console.error('NOWPayments checkout error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Checkout failed'
    }, { status: 500 })
  }
}
