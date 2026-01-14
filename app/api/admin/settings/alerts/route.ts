import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    // Get low stock items (3 or fewer)
    const { data: lowStock } = await supabase
      .from('product_variants')
      .select('id, sku, brand, model, stock')
      .lte('stock', 3)
      .order('stock', { ascending: true })

    // Get stuck reservations (older than 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    
    const { data: reservations } = await supabase
      .from('inventory_reservations')
      .select(`
        id,
        variant_id,
        quantity,
        created_at,
        product_variants(sku)
      `)
      .lt('created_at', thirtyMinutesAgo)
      .eq('status', 'pending')

    const stuckReservations = reservations?.map(r => {
      const variant = Array.isArray(r.product_variants) ? r.product_variants[0] : r.product_variants
      return {
        id: r.id,
        variant_id: r.variant_id,
        sku: (variant as { sku?: string })?.sku || 'Unknown',
        quantity: r.quantity,
        created_at: r.created_at
      }
    }) || []

    return NextResponse.json({
      lowStock: lowStock || [],
      stuckReservations
    })

  } catch (error) {
    console.error('Alerts fetch error:', error)
    return NextResponse.json({
      lowStock: [],
      stuckReservations: []
    })
  }
}
