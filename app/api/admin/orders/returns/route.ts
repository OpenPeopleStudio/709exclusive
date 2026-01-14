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
    const { data: returns } = await supabase
      .from('returns')
      .select(`
        *,
        order:orders(id, shipping_address, status)
      `)
      .order('created_at', { ascending: false })

    // Transform to include customer info from shipping_address
    const transformedReturns = returns?.map(ret => {
      const shippingAddress = ret.order?.shipping_address as {
        name?: string
        email?: string
      } | null
      return {
        ...ret,
        order: ret.order ? {
          id: ret.order.id,
          status: ret.order.status,
          customer_email: shippingAddress?.email || '',
          shipping_name: shippingAddress?.name || ''
        } : null
      }
    }) || []

    return NextResponse.json({ returns: transformedReturns })

  } catch (error) {
    console.error('Returns fetch error:', error)
    return NextResponse.json({ returns: [] })
  }
}

export async function PATCH(request: Request) {
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
    const { returnId, status } = await request.json()

    const updateData: Record<string, unknown> = { status }
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data: returnRecord, error } = await supabase
      .from('returns')
      .update(updateData)
      .eq('id', returnId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ return: returnRecord })

  } catch (error) {
    console.error('Return update error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to update return'
    }, { status: 500 })
  }
}
