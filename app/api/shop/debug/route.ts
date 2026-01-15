import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  const supabase = await createSupabaseServer()

  try {
    // Simple query first
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, brand, slug')
      .limit(5)

    if (error) {
      return NextResponse.json({ error: 'Products query failed', details: error.message })
    }

    // Check variants
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, product_id, stock, reserved')
      .limit(5)

    if (variantsError) {
      return NextResponse.json({ error: 'Variants query failed', details: variantsError.message })
    }

    return NextResponse.json({
      productsCount: products?.length || 0,
      variantsCount: variants?.length || 0,
      sampleProducts: products,
      sampleVariants: variants
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}