import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url)
  const tab = searchParams.get('tab')

  try {
    if (tab === 'users') {
      const { data: profiles } = await supabase
        .from('709_profiles')
        .select('id, role, full_name, created_at')
        .order('created_at', { ascending: false })

      // Try to get user emails - this requires either:
      // 1. Service role key access to auth.users
      // 2. Storing email in profiles table
      // For now, we'll try to get emails via a custom RPC or fall back to ID-based display
      
      // Attempt to fetch user data via service role (if configured)
      const authUsers: Record<string, { email: string; last_sign_in_at: string | null }> = {}
      
      try {
        // This uses the service role to list users - only works if SUPABASE_SERVICE_ROLE_KEY is set
        const { createClient } = await import('@supabase/supabase-js')
        const serviceClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          { auth: { autoRefreshToken: false, persistSession: false } }
        )
        
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const { data: authData } = await serviceClient.auth.admin.listUsers()
          if (authData?.users) {
            for (const u of authData.users) {
              authUsers[u.id] = { 
                email: u.email || '', 
                last_sign_in_at: u.last_sign_in_at || null 
              }
            }
          }
        }
      } catch {
        // Service role not available, continue without emails
        console.log('Service role not available for user emails')
      }

      const users = profiles?.map(p => ({
        id: p.id,
        email: authUsers[p.id]?.email || `User ${p.id.slice(0, 8)}`,
        full_name: p.full_name,
        role: p.role,
        created_at: p.created_at,
        last_sign_in: authUsers[p.id]?.last_sign_in_at || null
      })) || []

      return NextResponse.json({ users })
    }

    if (tab === 'activity') {
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      return NextResponse.json({ logs: logs || [] })
    }

    if (tab === 'pricing') {
      const { data: rules } = await supabase
        .from('pricing_rules')
        .select('*')
        .order('rule_type', { ascending: true })

      return NextResponse.json({ rules: rules || [] })
    }

    if (tab === 'shipping') {
      const { data: shippingMethods } = await supabase
        .from('shipping_methods')
        .select('*')
        .order('sort_order', { ascending: true })

      const { data: deliveryZones } = await supabase
        .from('local_delivery_zones')
        .select('*')
        .order('sort_order', { ascending: true })

      return NextResponse.json({
        shippingMethods: shippingMethods || [],
        deliveryZones: deliveryZones || []
      })
    }

    return NextResponse.json({})

  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}
