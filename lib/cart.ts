import { supabase } from './supabaseClient'
import { ProductVariant } from '@/types/database'

import type { CartItem } from '@/types/cart'

export interface CartItemWithVariant extends CartItem {
  variant: ProductVariant
}

export type Cart = CartItem[]

const CART_STORAGE_KEY = '709exclusive_cart'

// Client-side cart operations
export function getCart(): Cart {
  if (typeof window === 'undefined') return []
  try {
    const cart = localStorage.getItem(CART_STORAGE_KEY)
    return cart ? JSON.parse(cart) : []
  } catch {
    return []
  }
}

export function saveCart(cart: Cart): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
}

export function addToCart(cart: Cart, variantId: string, qty: number = 1): Cart {
  const existingItem = cart.find(item => item.variant_id === variantId)
  if (existingItem) {
    existingItem.qty += qty
  } else {
    cart.push({ variant_id: variantId, qty })
  }
  saveCart(cart)
  return cart
}

export function removeFromCart(cart: Cart, variantId: string): Cart {
  const newCart = cart.filter(item => item.variant_id !== variantId)
  saveCart(newCart)
  return newCart
}

export function updateQty(cart: Cart, variantId: string, qty: number): Cart {
  if (qty <= 0) {
    return removeFromCart(cart, variantId)
  }
  const item = cart.find(item => item.variant_id === variantId)
  if (item) {
    item.qty = qty
    saveCart(cart)
  }
  return cart
}

export function clearCart(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_STORAGE_KEY)
}

// Client-side cart display helper
export async function getCartDisplayData(cart: Cart): Promise<{
  items: Array<{
    variant_id: string
    qty: number
    variant?: {
      sku: string
      price_cents: number
      stock: number
      reserved: number
    }
  }>
  subtotal: number
}> {
  if (cart.length === 0) {
    return { items: [], subtotal: 0 }
  }

  const variantIds = cart.map(item => item.variant_id)
  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, sku, price_cents, stock, reserved')
    .in('id', variantIds)

  const items = cart.map(cartItem => {
    const variant = variants?.find(v => v.id === cartItem.variant_id)
    return {
      ...cartItem,
      variant
    }
  })

  const subtotal = items.reduce((sum, item) => {
    return sum + ((item.variant?.price_cents || 0) * item.qty)
  }, 0)

  return { items, subtotal }
}