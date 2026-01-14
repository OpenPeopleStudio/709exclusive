import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { isAdmin } from '@/lib/roles'
import { SupabaseClient } from '@supabase/supabase-js'
import { sendOrderCancelled } from '@/lib/email'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (!isAdmin(await getUserRole(supabase, user.id!))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { orderId }: { orderId: string } = await req.json()

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
  }

  try {
    // Get current order status and items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Can only cancel pending or paid orders (before fulfillment)
    if (!['pending', 'paid'].includes(order.status)) {
      return NextResponse.json({
        error: 'Cannot cancel order in current status',
        currentStatus: order.status
      }, { status: 400 })
    }

    // Get order items to release inventory reservations
    if (order.status === 'pending') {
      const { data: items } = await supabase
        .from('order_items')
        .select('variant_id, qty')
        .eq('order_id', orderId)

      if (items) {
        for (const item of items) {
          await supabase.rpc('release_reserved_inventory', {
            variant_id: item.variant_id,
            qty: item.qty
          })
        }
      }
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    // Trigger cancellation email to customer
    await sendOrderCancelled(orderId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Cancel order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getUserRole(supabase: SupabaseClient, userId: string): Promise<string | undefined> {
  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return profile?.role
}