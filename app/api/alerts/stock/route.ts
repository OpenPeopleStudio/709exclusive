import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  const supabase = await createSupabaseServer()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ alerts: [] })
  }

  try {
    const { data: alerts, error } = await supabase
      .from('stock_alerts')
      .select(`
        id,
        size,
        condition_code,
        notified_at,
        created_at,
        product:products(id, name, brand, slug)
      `)
      .eq('user_id', user.id)
      .is('notified_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ alerts })

  } catch (error) {
    console.error('Stock alerts fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { productId, size, conditionCode, email } = await request.json()

    if (!productId || !size) {
      return NextResponse.json({ error: 'Product ID and size required' }, { status: 400 })
    }

    // Use user's email if not provided
    const alertEmail = email || user.email

    const { data: alert, error } = await supabase
      .from('stock_alerts')
      .upsert({
        user_id: user.id,
        product_id: productId,
        size,
        condition_code: conditionCode || null,
        email: alertEmail,
      }, {
        onConflict: 'user_id,product_id,size,condition_code'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ alert })

  } catch (error) {
    console.error('Stock alert create error:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServer()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('id')

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('stock_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Stock alert delete error:', error)
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}
