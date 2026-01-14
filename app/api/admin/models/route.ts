import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')

    let query = supabase
      .from('product_models')
      .select('*')
      .order('brand, model')

    if (brand) {
      query = query.eq('brand', brand)
    }

    const { data: models, error } = await query

    if (error) throw error

    // Get unique brands
    const { data: allModels } = await supabase
      .from('product_models')
      .select('brand')

    const brands = [...new Set(allModels?.map(m => m.brand) || [])].sort()

    return NextResponse.json({ models, brands })
  } catch (error) {
    console.error('Admin models fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}