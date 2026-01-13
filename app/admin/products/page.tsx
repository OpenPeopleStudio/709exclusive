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
        // Fetch products
        const productsResponse = await fetch('/api/admin/products')
        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          setProducts(productsData.products || [])
        }

        // Fetch analytics
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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Product Management</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <Link
          href="/admin/products/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700"
        >
          Add Product
        </Link>
      </div>

      {/* Analytics Summary */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {analytics.reduce((sum, a) => sum + a.sold_units, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Units Sold</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analytics.reduce((sum, a) => sum + a.stock, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Stock Remaining</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {analytics.filter(a => a.sell_through_rate < 0.1).length}
            </div>
            <div className="text-sm text-gray-600">Slow Movers (&lt;10% sell-through)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {analytics.filter(a => a.days_to_first_sale !== null).length}
            </div>
            <div className="text-sm text-gray-600">Variants Sold</div>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Products ({products.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drop
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.brand}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.is_drop ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Drop
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Regular
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(product.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Analytics */}
      <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Performing Variants</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sell-Through
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days to First Sale
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.slice(0, 10).map((variant) => (
                <tr key={variant.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {variant.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {variant.sold_units}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {variant.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      variant.sell_through_rate > 0.8 ? 'bg-green-100 text-green-800' :
                      variant.sell_through_rate > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(variant.sell_through_rate * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {variant.days_to_first_sale ? `${variant.days_to_first_sale.toFixed(1)} days` : 'Not sold'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}