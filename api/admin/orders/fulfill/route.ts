import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { isAdmin } from '@/lib/roles'
import { sendOrderShipped } from '@/lib/email'

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
    // Get current order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Can only fulfill paid orders
    if (order.status !== 'paid') {
      return NextResponse.json({
        error: 'Can only fulfill paid orders',
        currentStatus: order.status
      }, { status: 400 })
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    // TODO: Trigger fulfillment email to customer

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Fulfill order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getUserRole(supabase: any, userId: string): Promise<string | undefined> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return profile?.role
}