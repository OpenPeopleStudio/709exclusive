'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { getCartDisplayData } from '@/lib/cart'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface CartDisplayItem {
  variant_id: string
  qty: number
  variant?: {
    sku: string
    price_cents: number
    stock: number
    reserved: number
    size?: string
    condition?: string
  }
}

export default function CartPage() {
  const { cart, removeFromCart, updateQty, itemCount } = useCart()
  const [cartDisplayData, setCartDisplayData] = useState<{
    items: CartDisplayItem[]
    subtotal: number
  }>({ items: [], subtotal: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCartData = async () => {
      if (cart.length > 0) {
        const data = await getCartDisplayData(cart)
        setCartDisplayData(data)
      } else {
        setCartDisplayData({ items: [], subtotal: 0 })
      }
      setLoading(false)
    }
    loadCartData()
  }, [cart])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
              <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Your cart is empty</h1>
            <p className="text-[var(--text-secondary)] mb-8">Looks like you haven&apos;t added anything yet.</p>
            <Link href="/" className="btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="container max-w-4xl">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-8">
            Shopping Cart
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartDisplayData.items.map((item) => {
                const available = item.variant ? item.variant.stock - item.variant.reserved : 0
                
                return (
                  <div 
                    key={item.variant_id} 
                    className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 md:p-6"
                  >
                    <div className="flex items-start gap-4">
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[var(--text-primary)] truncate">
                          {item.variant?.sku || `Variant ${item.variant_id.slice(0, 8)}`}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
                          {item.variant?.size && (
                            <span>Size: {item.variant.size}</span>
                          )}
                          {item.variant?.condition && (
                            <span>Condition: {item.variant.condition}</span>
                          )}
                        </div>
                        {item.variant && (
                          <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                            ${(item.variant.price_cents / 100).toFixed(2)}
                          </p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.variant_id, item.qty - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-8 text-center font-medium text-[var(--text-primary)]">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.variant_id, item.qty + 1)}
                          disabled={item.qty >= available}
                          className="w-8 h-8 flex items-center justify-center rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.variant_id)}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                        aria-label="Remove item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Line Total */}
                    {item.variant && (
                      <div className="mt-4 pt-4 border-t border-[var(--border-primary)] flex justify-between items-center text-sm">
                        <span className="text-[var(--text-muted)]">{available} available</span>
                        <span className="font-medium text-[var(--text-primary)]">
                          Subtotal: ${((item.variant.price_cents * item.qty) / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Items ({itemCount})</span>
                    <span className="text-[var(--text-primary)]">${(cartDisplayData.subtotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Shipping</span>
                    <span className="text-[var(--text-muted)]">Calculated at checkout</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-primary)] mb-6">
                  <div className="flex justify-between">
                    <span className="font-medium text-[var(--text-primary)]">Subtotal</span>
                    <span className="text-xl font-bold text-[var(--text-primary)]">
                      ${(cartDisplayData.subtotal / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="btn-primary w-full justify-center"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  href="/"
                  className="block text-center mt-4 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
