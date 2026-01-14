import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { getCheckoutQuote } from '@/lib/checkoutPricing'
import type { CartItem } from '@/types/cart'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()

  try {
    const { items, shippingAddress, shippingMethodCode }: {
      items: CartItem[]
      shippingAddress: {
        country: string
        province?: string
        postal_code?: string
        city?: string
      }
      shippingMethodCode?: string
    } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const quote = await getCheckoutQuote({
      supabase,
      items,
      shippingAddress: shippingAddress || { country: 'CA' },
      requestedShippingMethodCode: shippingMethodCode,
    })

    return NextResponse.json(quote)

  } catch (error) {
    const anyError = error as Error & { variant_id?: string }
    
    if (anyError.message === 'Insufficient stock') {
      return NextResponse.json(
        { error: anyError.message, variant_id: anyError.variant_id },
        { status: 409 }
      )
    }
    
    console.error('Quote error:', error)
    return NextResponse.json(
      { error: anyError.message || 'Failed to calculate quote' },
      { status: 500 }
    )
  }
}
