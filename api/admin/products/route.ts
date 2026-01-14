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
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (productsError) throw productsError

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Admin products fetch error:', error)
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