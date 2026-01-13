import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          qty,
          price_cents,
          product_variants (
            sku,
            brand,
            model,
            size,
            condition_code,
            products (
              name
            )
          )
        )
      `)
      .eq('id', params.id)
      .eq('customer_id', user.id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order detail fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}