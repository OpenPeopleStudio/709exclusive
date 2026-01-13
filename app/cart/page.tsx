'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { getCartDisplayData } from '@/lib/cart'

interface CartDisplayItem {
  variant_id: string
  qty: number
  variant?: {
    sku: string
    price_cents: number
    stock: number
    reserved: number
  }
}

export default function CartPage() {
  const { cart, removeFromCart, updateQty, itemCount } = useCart()
  const [cartDisplayData, setCartDisplayData] = useState<{
    items: CartDisplayItem[]
    subtotal: number
  }>({ items: [], subtotal: 0 })

  useEffect(() => {
    const loadCartData = async () => {
      if (cart.length > 0) {
        const data = await getCartDisplayData(cart)
        setCartDisplayData(data)
      } else {
        setCartDisplayData({ items: [], subtotal: 0 })
      }
    }
    loadCartData()
  }, [cart])

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="mt-4 text-gray-600">Your cart is empty</p>
            <Link
              href="/"
              className="mt-6 inline-block bg-indigo-600 text-white py-2 px-6 rounded-md font-medium hover:bg-indigo-700"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="space-y-6">
          {cartDisplayData.items.map((item) => (
            <div key={item.variant_id} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.variant?.sku || `Variant ${item.variant_id}`}</h3>
                <p className="text-gray-600">
                  Quantity: {item.qty}
                  {item.variant && (
                    <span className="ml-4">
                      ${(item.variant.price_cents * item.qty / 100).toFixed(2)}
                    </span>
                  )}
                </p>
                {item.variant && (
                  <p className="text-sm text-gray-500">
                    {item.variant.stock - item.variant.reserved} available
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQty(item.variant_id, item.qty - 1)}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                >
                  -
                </button>
                <span className="font-medium">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.variant_id, item.qty + 1)}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeFromCart(item.variant_id)}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t pt-8">
          <div className="flex justify-between items-center mb-6">
            <div className="text-lg font-semibold">
              Subtotal: ${(cartDisplayData.subtotal / 100).toFixed(2)}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Continue Shopping
            </Link>
            <Link
              href="/checkout"
              className="bg-indigo-600 text-white py-3 px-6 rounded-md font-medium hover:bg-indigo-700"
            >
              Proceed to Checkout ({itemCount} items)
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}