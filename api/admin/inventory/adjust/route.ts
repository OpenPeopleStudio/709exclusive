import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { isAdmin } from '@/lib/roles'
import { adjustInventory } from '@/lib/inventory'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (!isAdmin(await getUserRole(supabase, user.id!))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { variantId, adjustment, reason }: {
    variantId: string
    adjustment: number
    reason: string
  } = await req.json()

  if (!variantId || !reason.trim()) {
    return NextResponse.json({ error: 'Variant ID and reason required' }, { status: 400 })
  }

  try {
    await adjustInventory(variantId, adjustment, reason, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Inventory adjustment error:', error)
    return NextResponse.json({ error: 'Failed to adjust inventory' }, { status: 500 })
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