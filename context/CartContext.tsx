'use client'

import React, { createContext, useContext, useState } from 'react'
import { Cart, getCart, addToCart as addToCartUtil, removeFromCart as removeFromCartUtil, updateQty as updateQtyUtil, clearCart as clearCartUtil } from '@/lib/cart'

interface CartContextType {
  cart: Cart
  addToCart: (variantId: string, qty?: number) => void
  removeFromCart: (variantId: string) => void
  updateQty: (variantId: string, qty: number) => void
  clearCart: () => void
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(() => getCart())

  const addToCart = (variantId: string, qty: number = 1) => {
    setCart(currentCart => addToCartUtil([...currentCart], variantId, qty))
  }

  const removeFromCart = (variantId: string) => {
    setCart(currentCart => removeFromCartUtil([...currentCart], variantId))
  }

  const updateQty = (variantId: string, qty: number) => {
    setCart(currentCart => updateQtyUtil([...currentCart], variantId, qty))
  }

  const clearCart = () => {
    clearCartUtil()
    setCart([])
  }

  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0)

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      itemCount
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}