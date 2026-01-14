import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { isAdmin } from '@/lib/roles'
import { SupabaseClient } from '@supabase/supabase-js'

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
    // Fetch variants with availability
    const { data: variants, error: variantsError } = await supabase
      .from('variant_availability')
      .select('*')
      .order('sku')

    if (variantsError) throw variantsError

    // Fetch audit history (recent 100)
    const { data: auditHistory, error: auditError } = await supabase
      .from('inventory_audit')
      .select(`
        *,
        product_variants!inner(sku)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (auditError) throw auditError

    return NextResponse.json({ variants, auditHistory })
  } catch (error) {
    console.error('Admin inventory fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getUserRole(supabase: SupabaseClient, userId: string): Promise<string | undefined> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return profile?.role
}