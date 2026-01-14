import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    // Fetch consignors
    const { data: consignors } = await supabase
      .from('consignors')
      .select('*')
      .order('name')

    // Fetch consignment items
    const { data: items } = await supabase
      .from('consignment_items')
      .select(`
        *,
        variant:product_variants(sku, brand, model, size),
        consignor:consignors(name)
      `)
      .order('created_at', { ascending: false })

    // Fetch payouts
    const { data: payouts } = await supabase
      .from('consignment_payouts')
      .select(`
        *,
        consignor:consignors(name)
      `)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      consignors: consignors || [],
      items: items || [],
      payouts: payouts || []
    })

  } catch (error) {
    console.error('Consignment fetch error:', error)
    return NextResponse.json({
      consignors: [],
      items: [],
      payouts: []
    })
  }
}
