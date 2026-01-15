import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  const supabase = await createSupabaseServer()

  try {
    // Simple test query
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .limit(5)

    if (error) {
      return NextResponse.json({
        error: 'Database error',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      productCount: products?.length || 0,
      products: products
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}