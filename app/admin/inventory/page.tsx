'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  brand: string
  slug: string
  external_image_url: string | null
  created_at: string
}

interface Variant {
  id: string
  product_id: string
  sku: string
  size: string | null
  condition_code: string
  price_cents: number
  stock: number
  reserved: number
}

interface ProductWithVariant extends Product {
  variant: Variant | null
  total_stock: number
  available: number
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<ProductWithVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ stock: number; price: number }>({ stock: 0, price: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/admin/inventory/all')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (product: ProductWithVariant) => {
    setEditingId(product.id)
    setEditValues({
      stock: product.variant?.stock || 0,
      price: (product.variant?.price_cents || 0) / 100
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues({ stock: 0, price: 0 })
  }

  const saveEdit = async (product: ProductWithVariant) => {
    if (!product.variant) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/admin/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: product.variant.id,
          stock: editValues.stock,
          priceCents: Math.round(editValues.price * 100)
        })
      })

      if (response.ok) {
        await fetchInventory()
        setEditingId(null)
      }
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setSaving(false)
    }
  }

  const quickStockAdjust = async (product: ProductWithVariant, delta: number) => {
    if (!product.variant) return
    
    const newStock = Math.max(0, (product.variant.stock || 0) + delta)
    
    try {
      await fetch('/api/admin/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: product.variant.id,
          stock: newStock
        })
      })
      await fetchInventory()
    } catch (error) {
      console.error('Error adjusting stock:', error)
    }
  }

  // Filter and search
  const filteredProducts = products.filter(p => {
    // Search filter
    if (search) {
      const q = search.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q)) {
        return false
      }
    }
    
    // Stock filter
    if (filter === 'in_stock' && p.available <= 0) return false
    if (filter === 'out_of_stock' && p.available > 0) return false
    
    return true
  })

  // Stats
  const totalProducts = products.length
  const inStockCount = products.filter(p => p.available > 0).length
  const outOfStockCount = products.filter(p => p.available <= 0).length
  const totalUnits = products.reduce((sum, p) => sum + p.total_stock, 0)

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Inventory</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {totalProducts} products • {totalUnits} total units
          </p>
        </div>
        <Link 
          href="/admin/inventory/add"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Shoe
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border transition-all ${
            filter === 'all' 
              ? 'bg-[var(--accent)]/10 border-[var(--accent)]' 
              : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
          }`}
        >
          <p className="text-2xl font-bold text-[var(--text-primary)]">{totalProducts}</p>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">All Products</p>
        </button>
        <button
          onClick={() => setFilter('in_stock')}
          className={`p-4 rounded-xl border transition-all ${
            filter === 'in_stock' 
              ? 'bg-[var(--success)]/10 border-[var(--success)]' 
              : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
          }`}
        >
          <p className="text-2xl font-bold text-[var(--success)]">{inStockCount}</p>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">In Stock</p>
        </button>
        <button
          onClick={() => setFilter('out_of_stock')}
          className={`p-4 rounded-xl border transition-all ${
            filter === 'out_of_stock' 
              ? 'bg-[var(--error)]/10 border-[var(--error)]' 
              : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
          }`}
        >
          <p className="text-2xl font-bold text-[var(--error)]">{outOfStockCount}</p>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Out of Stock</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or brand..."
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Product List */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[var(--text-muted)]">
              {search ? `No products matching "${search}"` : 'No products found'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-primary)]">
            {filteredProducts.map((product) => (
              <div key={product.id} className="p-4 hover:bg-[var(--bg-tertiary)] transition-colors">
                <div className="flex items-center gap-4">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg bg-[var(--bg-tertiary)] overflow-hidden flex-shrink-0">
                    {product.external_image_url ? (
                      <Image
                        src={product.external_image_url}
                        alt={product.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                        <svg viewBox="0 0 100 60" className="w-8 h-8 opacity-30" fill="currentColor">
                          <path d="M5 45 Q5 35 15 30 L25 28 Q35 25 45 25 L70 25 Q85 25 90 35 L95 45 Q95 50 90 52 L10 52 Q5 52 5 45 Z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{product.brand}</p>
                    <p className="font-medium text-[var(--text-primary)] truncate">{product.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span className="text-[var(--text-muted)]">
                        Size: {product.variant?.size || '—'}
                      </span>
                      <span className={product.available > 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}>
                        {product.available > 0 ? `${product.available} in stock` : 'Out of stock'}
                      </span>
                    </div>
                  </div>

                  {/* Edit Mode or Quick Actions */}
                  {editingId === product.id ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-[var(--text-muted)]">Stock</label>
                        <input
                          type="number"
                          min="0"
                          value={editValues.stock}
                          onChange={(e) => setEditValues(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                          className="w-16 px-2 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-sm text-center"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-[var(--text-muted)]">Price</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">$</span>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={editValues.price}
                            onChange={(e) => setEditValues(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            className="w-20 pl-6 pr-2 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-sm"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => saveEdit(product)}
                        disabled={saving}
                        className="px-3 py-1.5 rounded-lg bg-[var(--success)] text-white text-sm font-medium"
                      >
                        {saving ? '...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {/* Price Display */}
                      <span className="text-lg font-bold text-[var(--text-primary)] min-w-[80px] text-right">
                        ${((product.variant?.price_cents || 0) / 100).toFixed(0)}
                      </span>

                      {/* Quick Stock Buttons */}
                      <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-lg p-1">
                        <button
                          onClick={() => quickStockAdjust(product, -1)}
                          disabled={product.available <= 0}
                          className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--error)] hover:bg-[var(--error)]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-[var(--text-primary)]">
                          {product.variant?.stock || 0}
                        </span>
                        <button
                          onClick={() => quickStockAdjust(product, 1)}
                          className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--success)] hover:bg-[var(--success)]/10 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => startEdit(product)}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
