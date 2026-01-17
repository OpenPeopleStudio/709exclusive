'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import StatsCard from '@/components/admin/StatsCard'
import SearchBar from '@/components/admin/SearchBar'
import DataTable from '@/components/admin/DataTable'
import Button from '@/components/ui/Button'

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
  const [search, setSearch] = useState('')

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
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Products" subtitle="Loading..." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 animate-pulse">
              <div className="h-6 w-12 bg-[var(--bg-tertiary)] rounded mb-2"></div>
              <div className="h-4 w-20 bg-[var(--bg-tertiary)] rounded"></div>
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
  
  const filteredProducts = products.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Products"
        subtitle={`${products.length} products in catalog`}
        actions={
          <>
            <Link href="/admin/models">
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Models
              </Button>
            </Link>
            <Link href="/admin/products/new">
              <Button variant="primary">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </Button>
            </Link>
          </>
        }
        stats={[
          {
            label: 'Units Sold',
            value: totalSold,
            trend: 'up',
          },
          {
            label: 'In Stock',
            value: totalStock,
          },
          {
            label: 'Slow Movers',
            value: slowMovers,
            trend: slowMovers > 5 ? 'warning' as any : 'neutral',
          },
          {
            label: 'Variants Sold',
            value: variantsSold,
          },
        ]}
      />

      <div className="mb-6">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search products by name, brand, or SKU..."
          resultsCount={filteredProducts.length}
        />
      </div>

      {/* Products Table/Cards */}
      <DataTable
        columns={[
          {
            key: 'name',
            label: 'Product',
            render: (product: Product) => (
              <div>
                <p className="font-medium text-[var(--text-primary)]">{product.name}</p>
                {product.brand && (
                  <p className="text-sm text-[var(--text-muted)]">{product.brand}</p>
                )}
              </div>
            ),
          },
          {
            key: 'category',
            label: 'Category',
            mobileHidden: true,
            render: (product: Product) => (
              <span className="text-sm text-[var(--text-secondary)]">
                {product.category || '—'}
              </span>
            ),
          },
          {
            key: 'type',
            label: 'Type',
            render: (product: Product) => (
              product.is_drop ? (
                <span className="inline-flex px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)] text-white shadow-[0_0_15px_rgba(255,0,255,0.4)]">
                  Drop
                </span>
              ) : (
                <span className="inline-flex px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)]">
                  Standard
                </span>
              )
            ),
          },
          {
            key: 'created_at',
            label: 'Created',
            mobileHidden: true,
            render: (product: Product) => (
              <span className="text-sm text-[var(--text-secondary)]">
                {new Date(product.created_at).toLocaleDateString()}
              </span>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            render: (product: Product) => (
              <div className="flex justify-end gap-2">
                <Link href={`/product/${product.slug}`} target="_blank">
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
                <Link href={`/admin/products/${product.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
            ),
          },
        ]}
        data={filteredProducts}
        keyExtractor={(product) => product.id}
        loading={loading}
        emptyMessage={search ? `No products matching "${search}"` : "No products yet. Create your first product!"}
        mobileCard={(product: Product) => (
          <div>
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--text-primary)] truncate">{product.name}</p>
                {product.brand && (
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{product.brand}</p>
                )}
              </div>
              {product.is_drop && (
                <span className="inline-flex px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)] text-white shadow-[0_0_15px_rgba(255,0,255,0.4)] flex-shrink-0">
                  Drop
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">
                {new Date(product.created_at).toLocaleDateString()}
              </span>
              <Link href={`/product/${product.slug}`} target="_blank">
                <Button variant="ghost" size="sm">
                  View
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        )}
      />

      {/* Top Performers */}
      {analytics.length > 0 && (
        <div className="mt-10 bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--glass-border)]">
            <h2 className="text-xl font-black text-gradient">Top Performers</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Best selling variants by performance metrics</p>
          </div>
          
          {/* Mobile: Cards */}
          <div className="md:hidden divide-y divide-[var(--glass-border)]">
            {analytics.slice(0, 10).map((variant) => (
              <div key={variant.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                    {variant.sku}
                  </div>
                  <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full ${
                    variant.sell_through_rate > 0.8 
                      ? 'bg-[var(--success)]/20 text-[var(--success)] shadow-[0_0_15px_rgba(0,255,136,0.3)]' 
                      : variant.sell_through_rate > 0.5 
                        ? 'bg-[var(--warning)]/20 text-[var(--warning)]' 
                        : 'bg-[var(--error)]/20 text-[var(--error)]'
                  }`}>
                    {(variant.sell_through_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Sold</div>
                    <div className="font-semibold text-[var(--text-primary)]">{variant.sold_units}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Stock</div>
                    <div className="font-semibold text-[var(--text-primary)]">{variant.stock}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Days</div>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {variant.days_to_first_sale ? variant.days_to_first_sale.toFixed(1) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--glass-border)] bg-[var(--bg-secondary)]">
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Sold
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Sell-Through
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Days to First Sale
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {analytics.slice(0, 10).map((variant) => (
                  <tr key={variant.id} className="hover:bg-white/5 transition-all duration-200">
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-[var(--text-primary)]">
                      {variant.sku}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--text-secondary)]">
                      {variant.sold_units}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--text-secondary)]">
                      {variant.stock}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full ${
                        variant.sell_through_rate > 0.8 
                          ? 'bg-[var(--success)]/20 text-[var(--success)] shadow-[0_0_15px_rgba(0,255,136,0.3)]' 
                          : variant.sell_through_rate > 0.5 
                            ? 'bg-[var(--warning)]/20 text-[var(--warning)]' 
                            : 'bg-[var(--error)]/20 text-[var(--error)]'
                      }`}>
                        {(variant.sell_through_rate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--text-muted)]">
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
