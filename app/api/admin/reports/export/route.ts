import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'

interface ShippingAddress {
  name?: string
  email?: string
  line1?: string
  line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export async function GET(request: Request) {
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

  // Only owners can export data
  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required for exports' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const days = parseInt(searchParams.get('days') || '30')
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  try {
    let csv = ''

    if (type === 'orders') {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_cents,
          shipping_address,
          tracking_number,
          carrier,
          created_at,
          paid_at,
          shipped_at
        `)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })

      csv = 'Order ID,Status,Total,Customer Email,Name,Address,City,Province,Postal,Tracking,Carrier,Created,Paid,Shipped\n'
      orders?.forEach(o => {
        const addr = o.shipping_address as ShippingAddress | null
        csv += `${o.id},${o.status},${((o.total_cents || 0) / 100).toFixed(2)},${addr?.email || ''},${addr?.name || ''},"${addr?.line1 || ''}",${addr?.city || ''},${addr?.state || ''},${addr?.postal_code || ''},${o.tracking_number || ''},${o.carrier || ''},${o.created_at},${o.paid_at || ''},${o.shipped_at || ''}\n`
      })
    }

    else if (type === 'inventory') {
      const { data: variants } = await supabase
        .from('product_variants')
        .select(`
          sku,
          size,
          condition,
          stock,
          reserved,
          price_cents,
          product:products(brand, model)
        `)
        .order('sku')

      csv = 'SKU,Brand,Model,Size,Condition,Stock,Reserved,Available,Price\n'
      variants?.forEach(v => {
        const product = Array.isArray(v.product) ? v.product[0] : v.product
        csv += `${v.sku || ''},${product?.brand || ''},${product?.model || ''},${v.size || ''},${v.condition || ''},${v.stock || 0},${v.reserved || 0},${(v.stock || 0) - (v.reserved || 0)},${((v.price_cents || 0) / 100).toFixed(2)}\n`
      })
    }

    else if (type === 'customers') {
      const { data: orders } = await supabase
        .from('orders')
        .select('shipping_address, total_cents, created_at')
        .gte('created_at', startDate)

      // Aggregate by customer email
      const customers: Record<string, { email: string; orders: number; total: number; lastOrder: string }> = {}
      orders?.forEach(o => {
        const addr = o.shipping_address as ShippingAddress | null
        const email = addr?.email
        if (email) {
          if (!customers[email]) {
            customers[email] = { email, orders: 0, total: 0, lastOrder: o.created_at }
          }
          customers[email].orders += 1
          customers[email].total += o.total_cents || 0
          if (o.created_at > customers[email].lastOrder) {
            customers[email].lastOrder = o.created_at
          }
        }
      })

      csv = 'Email,Orders,Total Spent,Last Order\n'
      Object.values(customers)
        .sort((a, b) => b.total - a.total)
        .forEach(c => {
          csv += `${c.email},${c.orders},${(c.total / 100).toFixed(2)},${c.lastOrder}\n`
        })
    }

    else if (type === 'products') {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          order_items(
            qty,
            price_cents,
            variant:product_variants(
              sku,
              product:products(brand, model)
            )
          )
        `)
        .in('status', ['paid', 'fulfilled', 'shipped', 'delivered'])
        .gte('created_at', startDate)

      const products: Record<string, { name: string; sku: string; sold: number; revenue: number }> = {}
      orders?.forEach(order => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        order.order_items?.forEach((item: any) => {
          const variant = Array.isArray(item.variant) ? item.variant[0] : item.variant
          const product = variant?.product
          const productData = Array.isArray(product) ? product[0] : product
          const name = productData ? `${productData.brand} ${productData.model}` : 'Unknown'
          const sku = variant?.sku || 'Unknown'
          if (!products[sku]) {
            products[sku] = { name, sku, sold: 0, revenue: 0 }
          }
          const qty = item.qty || 0
          products[sku].sold += qty
          products[sku].revenue += (item.price_cents || 0) * qty
        })
      })

      csv = 'Product,SKU,Sold,Revenue\n'
      Object.values(products)
        .sort((a, b) => b.revenue - a.revenue)
        .forEach(p => {
          csv += `"${p.name}",${p.sku},${p.sold},${(p.revenue / 100).toFixed(2)}\n`
        })
    }

    else if (type === 'brands') {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          order_items(
            qty,
            price_cents,
            variant:product_variants(
              product:products(brand)
            )
          )
        `)
        .in('status', ['paid', 'fulfilled', 'shipped', 'delivered'])
        .gte('created_at', startDate)

      const brands: Record<string, { brand: string; sold: number; revenue: number }> = {}
      orders?.forEach(order => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        order.order_items?.forEach((item: any) => {
          const variant = Array.isArray(item.variant) ? item.variant[0] : item.variant
          const product = variant?.product
          const productData = Array.isArray(product) ? product[0] : product
          const brand = productData?.brand || 'Unknown'
          if (!brands[brand]) {
            brands[brand] = { brand, sold: 0, revenue: 0 }
          }
          const qty = item.qty || 0
          brands[brand].sold += qty
          brands[brand].revenue += (item.price_cents || 0) * qty
        })
      })

      csv = 'Brand,Sold,Revenue\n'
      Object.values(brands)
        .sort((a, b) => b.revenue - a.revenue)
        .forEach(b => {
          csv += `${b.brand},${b.sold},${(b.revenue / 100).toFixed(2)}\n`
        })
    }

    else if (type === 'revenue') {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_cents, created_at')
        .in('status', ['paid', 'fulfilled', 'shipped', 'delivered'])
        .gte('created_at', startDate)
        .order('created_at')

      const monthly: Record<string, { month: string; revenue: number; orders: number }> = {}
      orders?.forEach(o => {
        const month = new Date(o.created_at).toLocaleString('default', { month: 'short', year: 'numeric' })
        if (!monthly[month]) {
          monthly[month] = { month, revenue: 0, orders: 0 }
        }
        monthly[month].revenue += o.total_cents || 0
        monthly[month].orders += 1
      })

      csv = 'Month,Revenue,Orders\n'
      Object.values(monthly).forEach(m => {
        csv += `${m.month},${(m.revenue / 100).toFixed(2)},${m.orders}\n`
      })
    }

    // Log the export
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action: 'export_report',
      entity_type: 'report',
      entity_id: type,
      details: { type, days }
    })

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${type}-export.csv"`
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 })
  }
}
