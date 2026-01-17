'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductCard, { ProductCardSkeleton, ProductCardData } from '@/components/ui/ProductCard'
import FilterPill, { SizeButton, ConditionButton } from '@/components/ui/FilterPill'
import FilterDrawer from '@/components/ui/FilterDrawer'
import Link from 'next/link'
import Button from '@/components/ui/Button'

interface Product extends ProductCardData {
  category: string
  variants_count: number
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
  dropsOnly: boolean
}

type PageMode = 'shop' | 'new' | 'drops'

const SIZE_OPTIONS = ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13', '14']
const CONDITION_OPTIONS = ['DS', 'VNDS', 'PADS', 'USED']

function ShopContent() {
  const searchParams = useSearchParams()
  
  // Determine page mode from URL params
  const getPageMode = (): PageMode => {
    if (searchParams.get('drops') === 'true') return 'drops'
    if (searchParams.get('sort') === 'newest' && !searchParams.get('brands')) return 'new'
    return 'shop'
  }
  
  const pageMode = getPageMode()
  const initialSearch = searchParams.get('search') || ''
  
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [filters, setFilters] = useState<Filters>({
    search: initialSearch,
    brands: [],
    sizes: [],
    conditions: [],
    priceMin: '',
    priceMax: '',
    sort: pageMode === 'drops' ? 'ending_soon' : 'newest',
    inStock: true,
    dropsOnly: pageMode === 'drops'
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
      if (filters.dropsOnly) params.set('dropsOnly', 'true')

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
      sort: pageMode === 'drops' ? 'ending_soon' : 'newest',
      inStock: true,
      dropsOnly: pageMode === 'drops'
    })
  }

  const activeFilterCount = filters.brands.length + filters.sizes.length + filters.conditions.length +
    (filters.priceMin ? 1 : 0) + (filters.priceMax ? 1 : 0)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container">
          {/* Page Header */}
          <div className="mb-10 md:mb-14">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-gradient mb-3">
              {pageMode === 'drops' ? 'Drops' : pageMode === 'new' ? 'New' : 'Shop'}
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[var(--text-primary)] mt-2 mb-4">
              {pageMode === 'drops'
                ? 'Active drops'
                : pageMode === 'new'
                  ? 'New arrivals'
                  : 'All inventory'}
            </h1>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl leading-relaxed">
              {pageMode === 'drops'
                ? 'Limited releases with local delivery and pickup options.'
                : pageMode === 'new'
                  ? 'The most recent additions to the marketplace.'
                  : 'Browse verified sneakers and streetwear across all sizes and conditions.'}
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Button href="/shop" variant="secondary" size="sm">All inventory</Button>
              <Button href="/shop?sort=newest" variant="secondary" size="sm">New arrivals</Button>
              <Button href="/shop?drops=true" variant="secondary" size="sm">Drops</Button>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-28 space-y-8">
                {/* Search */}
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Search..."
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-lg"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Brands */}
                {brands.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Brand</h3>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2">
                      {brands.map(brand => (
                        <FilterPill
                          key={brand}
                          label={brand}
                          selected={filters.brands.includes(brand)}
                          onClick={() => toggleBrand(brand)}
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Size</h3>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SIZE_OPTIONS.map(size => (
                      <SizeButton
                        key={size}
                        label={size}
                        selected={filters.sizes.includes(size)}
                        onClick={() => toggleSize(size)}
                      />
                    ))}
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Condition</h3>
                  <div className="flex flex-wrap gap-2">
                    {CONDITION_OPTIONS.map(condition => (
                      <ConditionButton
                        key={condition}
                        label={condition}
                        selected={filters.conditions.includes(condition)}
                        onClick={() => toggleCondition(condition)}
                      />
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Price Range</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">$</span>
                      <input
                        type="number"
                        value={filters.priceMin}
                        onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                        placeholder="Min"
                        className="pl-7 py-2.5 text-sm"
                      />
                    </div>
                    <span className="text-[var(--text-muted)]">–</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">$</span>
                      <input
                        type="number"
                        value={filters.priceMax}
                        onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                        placeholder="Max"
                        className="pl-7 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="w-full py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    Clear All Filters ({activeFilterCount})
                  </button>
                )}
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Mobile Search */}
              <div className="lg:hidden mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Search sneakers..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Sticky Sort/Filter Bar */}
              <div className="sticky top-20 z-30 -mx-4 px-4 py-4 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border-b border-[var(--glass-border)] mb-8">
                <div className="flex items-center justify-between gap-4">
                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setShowMobileFilters(true)}
                    className={`lg:hidden flex items-center gap-2 px-5 py-3 rounded-full font-semibold transition-all duration-300 ${
                      activeFilterCount > 0
                        ? 'bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)] text-white shadow-[0_0_20px_rgba(255,0,255,0.4)]'
                        : 'bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--border-glow)]'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {/* Results Count - Desktop */}
                  <p className="hidden lg:block text-sm text-[var(--text-muted)]">
                    {loading ? 'Loading...' : `${products.length} products`}
                  </p>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm text-[var(--text-muted)] hidden sm:inline">Sort:</span>
                    <select
                      value={filters.sort}
                      onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value as Filters['sort'] }))}
                      className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm"
                    >
                      <option value="newest">Newest</option>
                      <option value="price_low">Price: Low to High</option>
                      <option value="price_high">Price: High to Low</option>
                      <option value="ending_soon">Ending Soon</option>
                    </select>
                  </div>
                </div>

                {/* Mobile Results Count */}
                <p className="lg:hidden text-xs text-[var(--text-muted)] mt-2">
                  {loading ? 'Loading...' : `${products.length} products found`}
                </p>
              </div>

              {/* Product Grid */}
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                  {[...Array(9)].map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] flex items-center justify-center">
                    <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-[var(--text-secondary)] mb-2 text-lg font-semibold">No products found</p>
                  <p className="text-sm text-[var(--text-muted)] mb-8">Try adjusting your filters</p>
                  <button onClick={clearFilters} className="btn-primary">
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                  {products.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      currentTime={currentTime}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Mobile Filter Drawer */}
      <FilterDrawer
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        brands={brands}
        selectedBrands={filters.brands}
        onToggleBrand={toggleBrand}
        sizes={SIZE_OPTIONS}
        selectedSizes={filters.sizes}
        onToggleSize={toggleSize}
        conditions={CONDITION_OPTIONS}
        selectedConditions={filters.conditions}
        onToggleCondition={toggleCondition}
        priceMin={filters.priceMin}
        priceMax={filters.priceMax}
        onPriceMinChange={(v) => setFilters(prev => ({ ...prev, priceMin: v }))}
        onPriceMaxChange={(v) => setFilters(prev => ({ ...prev, priceMax: v }))}
        onApply={() => {}}
        onClear={clearFilters}
        activeCount={activeFilterCount}
      />
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <main className="flex-1 pt-24 pb-16">
          <div className="container">
            <div className="mb-8 md:mb-10">
              <div className="skeleton h-8 w-32 mb-2"></div>
              <div className="skeleton h-5 w-64"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {[...Array(9)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <ShopContent />
    </Suspense>
  )
}
