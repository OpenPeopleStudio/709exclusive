import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const { searchParams } = new URL(request.url)

  const search = searchParams.get('search')
  const brands = searchParams.get('brands')?.split(',').filter(Boolean)
  const sizes = searchParams.get('sizes')?.split(',').filter(Boolean)
  const conditions = searchParams.get('conditions')?.split(',').filter(Boolean)
  const priceMin = searchParams.get('priceMin')
  const priceMax = searchParams.get('priceMax')
  const sort = searchParams.get('sort') || 'newest'
  const inStock = searchParams.get('inStock') === 'true'

  try {
    // Build query for products with aggregated variant data
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        brand,
        slug,
        category,
        description,
        is_drop,
        drop_starts_at,
        drop_ends_at,
        created_at,
        product_images(url, is_primary),
        product_variants(
          id,
          size,
          condition_code,
          price_cents,
          stock,
          reserved
        )
      `)

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%`)
    }

    // Apply brand filter
    if (brands && brands.length > 0) {
      query = query.in('brand', brands)
    }

    const { data: rawProducts, error } = await query

    if (error) throw error

    // Process and filter products
    let products = (rawProducts || []).map(product => {
      const variants = product.product_variants || []
      const availableVariants = variants.filter((v: { stock: number; reserved: number }) => 
        v.stock - v.reserved > 0
      )

      // Filter by size if specified
      let filteredVariants = availableVariants
      if (sizes && sizes.length > 0) {
        filteredVariants = filteredVariants.filter((v: { size: string }) => sizes.includes(v.size))
      }

      // Filter by condition if specified
      if (conditions && conditions.length > 0) {
        filteredVariants = filteredVariants.filter((v: { condition_code: string }) => 
          conditions.includes(v.condition_code)
        )
      }

      // Filter by price range
      if (priceMin) {
        const minCents = parseFloat(priceMin) * 100
        filteredVariants = filteredVariants.filter((v: { price_cents: number }) => v.price_cents >= minCents)
      }
      if (priceMax) {
        const maxCents = parseFloat(priceMax) * 100
        filteredVariants = filteredVariants.filter((v: { price_cents: number }) => v.price_cents <= maxCents)
      }

      const prices = filteredVariants.map((v: { price_cents: number }) => v.price_cents)
      const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0
      const sizesAvailable = [...new Set(filteredVariants.map((v: { size: string }) => v.size))]
      const conditionsAvailable = [...new Set(filteredVariants.map((v: { condition_code: string }) => v.condition_code))]

      const primaryImage = product.product_images?.find((img: { is_primary: boolean }) => img.is_primary)
        || product.product_images?.[0]

      return {
        id: product.id,
        name: product.name,
        brand: product.brand,
        slug: product.slug,
        category: product.category,
        lowest_price_cents: lowestPrice,
        variants_count: filteredVariants.length,
        sizes_available: sizesAvailable,
        conditions_available: conditionsAvailable,
        is_drop: product.is_drop,
        drop_ends_at: product.drop_ends_at,
        created_at: product.created_at,
        primary_image: primaryImage?.url || null,
        last_sold_cents: null // Would come from order history
      }
    })

    // Filter out products with no matching variants if inStock
    if (inStock) {
      products = products.filter(p => p.variants_count > 0)
    }

    // Sort products
    switch (sort) {
      case 'price_low':
        products.sort((a, b) => a.lowest_price_cents - b.lowest_price_cents)
        break
      case 'price_high':
        products.sort((a, b) => b.lowest_price_cents - a.lowest_price_cents)
        break
      case 'ending_soon':
        products.sort((a, b) => {
          if (!a.drop_ends_at && !b.drop_ends_at) return 0
          if (!a.drop_ends_at) return 1
          if (!b.drop_ends_at) return -1
          return new Date(a.drop_ends_at).getTime() - new Date(b.drop_ends_at).getTime()
        })
        break
      case 'newest':
      default:
        products.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    }

    return NextResponse.json({ products })

  } catch (error) {
    console.error('Shop fetch error:', error)
    return NextResponse.json({ products: [] })
  }
}
