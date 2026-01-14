import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  const supabase = await createSupabaseServer()

  try {
    const { data: products } = await supabase
      .from('products')
      .select('brand')

    const brands = [...new Set(products?.map(p => p.brand).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))

    return NextResponse.json({ brands })

  } catch (error) {
    console.error('Brands fetch error:', error)
    return NextResponse.json({ brands: [] })
  }
}
