'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  brand: string | null
  category: string | null
  created_at: string
  drop_starts_at: string | null
  drop_ends_at: string | null
  is_drop: boolean
}

interface VariantAnalytics {
  id: string
  sku: string
  stock: number
  reserved: number
  sold_units: number
  sell_through_rate: number
  first_sold_at: string | null
  days_to_first_sale: number | null
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [analytics, setAnalytics] = useState<VariantAnalytics[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsResponse = await fetch('/api/admin/products')
        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          setProducts(productsData.products || [])
        }

        const analyticsResponse = await fetch('/api/admin/analytics')
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json()
          setAnalytics(analyticsData.analytics || [])
        }
      } catch (error) {
        console.error('Error fetching admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Products</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
              <div className="skeleton h-8 w-16 mb-2"></div>
              <div className="skeleton h-4 w-24"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const totalSold = analytics.reduce((sum, a) => sum + a.sold_units, 0)
  const totalStock = analytics.reduce((sum, a) => sum + a.stock, 0)
  const slowMovers = analytics.filter(a => a.sell_through_rate < 0.1).length
  const variantsSold = analytics.filter(a => a.days_to_first_sale !== null).length

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">
          Add Product
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <p className="text-3xl font-bold text-[var(--accent)]">{totalSold}</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Units Sold</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <p className="text-3xl font-bold text-[var(--success)]">{totalStock}</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">In Stock</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <p className="text-3xl font-bold text-[var(--warning)]">{slowMovers}</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Slow Movers</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <p className="text-3xl font-bold text-[var(--text-primary)]">{variantsSold}</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Variants Sold</p>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-primary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            All Products ({products.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{product.name}</p>
                      {product.brand && (
                        <p className="text-sm text-[var(--text-muted)]">{product.brand}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                    {product.category || '—'}
                  </td>
                  <td className="px-6 py-4">
                    {product.is_drop ? (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-[var(--accent)]/20 text-[var(--accent)]">
                        Drop
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                        Regular
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                    {new Date(product.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/product/${product.slug}`}
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    No products yet. Create your first product to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performers */}
      {analytics.length > 0 && (
        <div className="mt-8 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-primary)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Top Performers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-primary)]">
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Sell-Through
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    Days to First Sale
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {analytics.slice(0, 10).map((variant) => (
                  <tr key={variant.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-[var(--text-primary)]">
                      {variant.sku}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {variant.sold_units}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {variant.stock}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        variant.sell_through_rate > 0.8 
                          ? 'bg-[var(--success)]/20 text-[var(--success)]' 
                          : variant.sell_through_rate > 0.5 
                            ? 'bg-[var(--warning)]/20 text-[var(--warning)]' 
                            : 'bg-[var(--error)]/20 text-[var(--error)]'
                      }`}>
                        {(variant.sell_through_rate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                      {variant.days_to_first_sale ? `${variant.days_to_first_sale.toFixed(1)} days` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
