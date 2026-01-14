'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Product {
  id: string
  name: string
  brand: string
  slug: string
  category: string
  lowest_price_cents: number
  variants_count: number
  sizes_available: string[]
  conditions_available: string[]
  is_drop: boolean
  drop_ends_at: string | null
  created_at: string
  primary_image: string | null
  last_sold_cents: number | null
}

interface Filters {
  search: string
  brands: string[]
  sizes: string[]
  conditions: string[]
  priceMin: string
  priceMax: string
  sort: 'newest' | 'price_low' | 'price_high' | 'ending_soon'
  inStock: boolean
}

const SIZE_OPTIONS = ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13', '14']
const CONDITION_OPTIONS = ['DS', 'VNDS', 'PADS', 'USED']

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [filters, setFilters] = useState<Filters>({
    search: '',
    brands: [],
    sizes: [],
    conditions: [],
    priceMin: '',
    priceMax: '',
    sort: 'newest',
    inStock: true
  })

  // Update time periodically for drop countdowns
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchBrands()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.brands.length) params.set('brands', filters.brands.join(','))
      if (filters.sizes.length) params.set('sizes', filters.sizes.join(','))
      if (filters.conditions.length) params.set('conditions', filters.conditions.join(','))
      if (filters.priceMin) params.set('priceMin', filters.priceMin)
      if (filters.priceMax) params.set('priceMax', filters.priceMax)
      params.set('sort', filters.sort)
      if (filters.inStock) params.set('inStock', 'true')

      const response = await fetch(`/api/shop?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const debounce = setTimeout(fetchProducts, 300)
    return () => clearTimeout(debounce)
  }, [fetchProducts])

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/shop/brands')
      if (response.ok) {
        const data = await response.json()
        setBrands(data.brands || [])
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  const toggleBrand = (brand: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand]
    }))
  }

  const toggleSize = (size: string) => {
    setFilters(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }))
  }

  const toggleCondition = (condition: string) => {
    setFilters(prev => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter(c => c !== condition)
        : [...prev.conditions, condition]
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      brands: [],
      sizes: [],
      conditions: [],
      priceMin: '',
      priceMax: '',
      sort: 'newest',
      inStock: true
    })
  }

  const activeFilterCount = filters.brands.length + filters.sizes.length + filters.conditions.length +
    (filters.priceMin ? 1 : 0) + (filters.priceMax ? 1 : 0)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search sneakers, brands, models..."
                className="w-full pl-12 pr-4 py-4 text-lg rounded-xl"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">Sort:</span>
              <select
                value={filters.sort}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value as Filters['sort'] }))}
                className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm"
              >
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="ending_soon">Ending Soon</option>
              </select>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Brands */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Brand</h3>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {brands.map(brand => (
                      <button
                        key={brand}
                        onClick={() => toggleBrand(brand)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          filters.brands.includes(brand)
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)]'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_OPTIONS.map(size => (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`w-10 h-10 text-sm rounded-lg transition-colors ${
                          filters.sizes.includes(size)
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Condition</h3>
                  <div className="flex flex-wrap gap-2">
                    {CONDITION_OPTIONS.map(condition => (
                      <button
                        key={condition}
                        onClick={() => toggleCondition(condition)}
                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                          filters.conditions.includes(condition)
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)]'
                        }`}
                      >
                        {condition}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Price Range</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">$</span>
                      <input
                        type="number"
                        value={filters.priceMin}
                        onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                        placeholder="Min"
                        className="pl-7 py-2 text-sm"
                      />
                    </div>
                    <span className="text-[var(--text-muted)]">–</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">$</span>
                      <input
                        type="number"
                        value={filters.priceMax}
                        onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                        placeholder="Max"
                        className="pl-7 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Count */}
          <p className="text-sm text-[var(--text-muted)] mb-6">
            {loading ? 'Loading...' : `${products.length} products found`}
          </p>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-[var(--bg-secondary)] rounded-lg mb-3"></div>
                  <div className="h-4 bg-[var(--bg-secondary)] rounded w-1/3 mb-2"></div>
                  <div className="h-5 bg-[var(--bg-secondary)] rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-[var(--bg-secondary)] rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--text-muted)] mb-4">No products found matching your filters</p>
              <button onClick={clearFilters} className="btn-primary">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} currentTime={currentTime} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

function ProductCard({ product, currentTime }: { product: Product; currentTime: number }) {
  const isDropEnding = product.is_drop && product.drop_ends_at && 
    new Date(product.drop_ends_at).getTime() - currentTime < 24 * 60 * 60 * 1000

  const priceDropped = product.last_sold_cents && product.lowest_price_cents < product.last_sold_cents
  const isNew = new Date(product.created_at).getTime() > currentTime - 7 * 24 * 60 * 60 * 1000

  return (
    <Link href={`/product/${product.slug}`} className="group">
      <div className="relative aspect-square bg-[var(--bg-secondary)] rounded-lg overflow-hidden mb-3">
        {product.primary_image ? (
          <Image
            src={product.primary_image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
            No Image
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_drop && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
              isDropEnding ? 'bg-[var(--error)] text-white' : 'bg-[var(--accent)] text-white'
            }`}>
              {isDropEnding ? 'ENDING SOON' : 'DROP'}
            </span>
          )}
          {priceDropped && (
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-[var(--success)] text-white">
              PRICE DROP
            </span>
          )}
          {isNew && (
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-500 text-white">
              NEW
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            // Add to wishlist
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <p className="text-sm text-[var(--text-muted)]">{product.brand}</p>
      <h3 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
        {product.name}
      </h3>
      <div className="flex items-center gap-2 mt-1">
        <span className="font-semibold text-[var(--text-primary)]">
          From ${(product.lowest_price_cents / 100).toFixed(0)}
        </span>
        {product.last_sold_cents && product.last_sold_cents !== product.lowest_price_cents && (
          <span className="text-sm text-[var(--text-muted)] line-through">
            ${(product.last_sold_cents / 100).toFixed(0)}
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-1">
        {product.sizes_available?.length || 0} sizes • {product.conditions_available?.join(', ')}
      </p>
    </Link>
  )
}
