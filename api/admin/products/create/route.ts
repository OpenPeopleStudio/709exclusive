import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { isAdmin } from '@/lib/roles'
import { SupabaseClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (!isAdmin(await getUserRole(supabase, user.id!))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const {
    product,
    variants
  }: {
    product: {
      name: string
      brand: string
      category: string
      description: string
      isDrop: boolean
      dropStartsAt?: string
      dropEndsAt?: string
    }
    variants: Array<{
      brand: string
      model: string
      size: string
      condition: string
      price: number
      stock: number
    }>
  } = await req.json()

  try {
    // Create product
    const { data: createdProduct, error: productError } = await supabase
      .from('products')
      .insert({
        name: product.name,
        brand: product.brand,
        category: product.category,
        description: product.description,
        is_drop: product.isDrop,
        drop_starts_at: product.isDrop && product.dropStartsAt ? new Date(product.dropStartsAt).toISOString() : null,
        drop_ends_at: product.isDrop && product.dropEndsAt ? new Date(product.dropEndsAt).toISOString() : null,
      })
      .select()
      .single()

    if (productError) throw productError

    // Create variants
    for (const variant of variants) {
      const { error: variantError } = await supabase.rpc('create_variant_with_sku', {
        product_id_input: createdProduct.id,
        brand_input: variant.brand,
        model_input: variant.model,
        size_input: variant.size,
        condition_input: variant.condition,
        price_input: variant.price * 100, // Convert to cents
        stock_input: variant.stock
      })

      if (variantError) throw variantError
    }

    return NextResponse.json({ success: true, productId: createdProduct.id })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
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