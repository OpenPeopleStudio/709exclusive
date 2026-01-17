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
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
                  Drop
                </span>
              ) : (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
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
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="font-medium text-[var(--text-primary)]">{product.name}</p>
                {product.brand && (
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">{product.brand}</p>
                )}
              </div>
              {product.is_drop && (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
                  Drop
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">
                {new Date(product.created_at).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <Link href={`/product/${product.slug}`} target="_blank">
                  <Button variant="ghost" size="sm">View</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      />

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
