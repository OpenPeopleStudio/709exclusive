import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyNOWPaymentsIPN, type NOWPaymentsIPNPayload } from '@/lib/nowpayments'

// Use service role for webhook handling
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const payload: NOWPaymentsIPNPayload = await request.json()
    const signature = request.headers.get('x-nowpayments-sig')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Verify webhook signature
    const isValid = verifyNOWPaymentsIPN(payload as unknown as Record<string, unknown>, signature)
    if (!isValid) {
      console.error('Invalid NOWPayments webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('NOWPayments webhook:', payload.payment_status, payload.order_id)

    // Find order by order_id (which we passed as order.id)
    const { data: order } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', payload.order_id)
      .single()

    if (!order) {
      console.error('Order not found:', payload.order_id)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    switch (payload.payment_status) {
      case 'finished':
      case 'confirmed':
        // Payment confirmed - update order status
        await supabase
          .from('orders')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString(),
            crypto_payment_status: 'confirmed',
            crypto_network: payload.pay_currency,
            crypto_transaction_id: String(payload.payment_id),
          })
          .eq('id', order.id)

        console.log('Order paid via NOWPayments:', order.id)
        break

      case 'waiting':
      case 'confirming':
      case 'sending':
        // Payment in progress
        await supabase
          .from('orders')
          .update({ 
            crypto_payment_status: payload.payment_status,
          })
          .eq('id', order.id)
        break

      case 'partially_paid':
        // Partial payment received
        await supabase
          .from('orders')
          .update({ 
            crypto_payment_status: 'partially_paid',
          })
          .eq('id', order.id)
        break

      case 'failed':
      case 'expired':
      case 'refunded':
        // Payment failed
        if (order.status === 'pending') {
          await supabase
            .from('orders')
            .update({ 
              status: 'cancelled',
              crypto_payment_status: payload.payment_status,
            })
            .eq('id', order.id)

          console.log('Order cancelled due to failed NOWPayments:', order.id)
        }
        break

      default:
        console.log('Unhandled NOWPayments status:', payload.payment_status)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('NOWPayments webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
