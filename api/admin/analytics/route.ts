import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { isAdmin } from '@/lib/roles'

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (!isAdmin(await getUserRole(supabase, user.id!))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    // Get analytics data
    const { data: analytics, error: analyticsError } = await supabase
      .from('admin_variant_analytics')
      .select('*')
      .order('sell_through_rate', { ascending: false })

    if (analyticsError) throw analyticsError

    // Calculate summary stats
    const totalSold = analytics.reduce((sum, a) => sum + a.sold_units, 0)
    const totalStock = analytics.reduce((sum, a) => sum + a.stock, 0)
    const slowMovers = analytics.filter(a => a.sell_through_rate < 0.1).length
    const soldVariants = analytics.filter(a => a.first_sold_at !== null).length

    return NextResponse.json({
      analytics,
      summary: {
        totalSold,
        totalStock,
        slowMovers,
        soldVariants
      }
    })
  } catch (error) {
    console.error('Admin analytics fetch error:', error)
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