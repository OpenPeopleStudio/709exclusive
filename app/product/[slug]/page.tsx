'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useCart } from '@/context/CartContext'
import { getDropStatus, formatTimeRemaining } from '@/lib/drops'
import { Product, ProductVariant, ProductImage } from '@/types/database'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ShippingEstimator from '@/components/ShippingEstimator'
import ConditionGuide from '@/components/ConditionGuide'
import SizingGuide from '@/components/SizingGuide'

interface PriceHistory {
  price_cents: number
  recorded_at: string
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>('')
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [images, setImages] = useState<ProductImage[]>([])
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedCondition, setSelectedCondition] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<number>(0)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [addedToCart, setAddedToCart] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const { addToCart } = useCart()

  // Resolve params promise
  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    if (!slug) return

    const fetchProduct = async () => {
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single()

      if (productData) {
        setProduct(productData)

        const { data: variantsData } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productData.id)

        setVariants(variantsData || [])

        const { data: imagesData } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productData.id)
          .order('position')

        setImages(imagesData || [])

        // Fetch price history
        if (variantsData && variantsData.length > 0) {
          const variantIds = variantsData.map(v => v.id)
          const { data: historyData } = await supabase
            .from('price_history')
            .select('price_cents, recorded_at')
            .in('variant_id', variantIds)
            .order('recorded_at', { ascending: false })
            .limit(20)
          
          setPriceHistory(historyData || [])
        }

        // Check wishlist status
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: wishlistItem } = await supabase
            .from('wishlist_items')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', productData.id)
            .maybeSingle()
          
          setIsWishlisted(!!wishlistItem)

          // Track recently viewed
          fetch('/api/recently-viewed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: productData.id })
          })
        }

        // Set initial selections
        if (variantsData && variantsData.length > 0) {
          const available = variantsData.find(v => (v.stock - v.reserved) > 0)
          if (available) {
            setSelectedSize(available.size || '')
            setSelectedCondition(available.condition_code || '')
          }
        }
      }

      setLoading(false)
    }

    fetchProduct()
  }, [slug])

  useEffect(() => {
    if (!product) return

    const updateTimer = () => {
      const dropStatus = getDropStatus(product)
      if (dropStatus.timeUntilStart) {
        setTimeRemaining(formatTimeRemaining(dropStatus.timeUntilStart))
      } else if (dropStatus.timeUntilEnd) {
        setTimeRemaining(formatTimeRemaining(dropStatus.timeUntilEnd))
      } else {
        setTimeRemaining('')
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [product])

  // Get unique sizes and conditions
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))]
  const conditions = [...new Set(variants.map(v => v.condition_code).filter(Boolean))]

  // Build size/condition grid
  const getSizeConditionGrid = () => {
    const grid: Record<string, Record<string, ProductVariant | null>> = {}
    
    sizes.forEach(size => {
      grid[size!] = {}
      conditions.forEach(condition => {
        const variant = variants.find(v => 
          v.size === size && v.condition_code === condition && (v.stock - v.reserved) > 0
        )
        grid[size!][condition!] = variant || null
      })
    })

    return grid
  }

  const sizeConditionGrid = getSizeConditionGrid()

  // Get selected variant
  const selectedVariant = variants.find(v => 
    v.size === selectedSize && v.condition_code === selectedCondition
  )

  // Get price range
  const availableVariants = variants.filter(v => (v.stock - v.reserved) > 0)
  const priceRange = availableVariants.length > 0 ? {
    min: Math.min(...availableVariants.map(v => v.price_cents)),
    max: Math.max(...availableVariants.map(v => v.price_cents)),
  } : null

  // Get market context
  const getMarketContext = () => {
    if (priceHistory.length === 0) return null
    const prices = priceHistory.map(h => h.price_cents)
    return {
      lastSold: priceHistory[0]?.price_cents,
      avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      lowestRecent: Math.min(...prices),
      highestRecent: Math.max(...prices),
    }
  }

  const marketContext = getMarketContext()

  const handleAddToCart = () => {
    if (selectedVariant) {
      addToCart(selectedVariant.id)
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 2000)
    }
  }

  const handleWishlist = async () => {
    if (!product) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/account/login'
      return
    }

    try {
      if (isWishlisted) {
        await fetch(`/api/wishlist?productId=${product.id}`, { method: 'DELETE' })
        setIsWishlisted(false)
      } else {
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            sizePreference: selectedSize,
            conditionPreference: selectedCondition,
          })
        })
        setIsWishlisted(true)
      }
    } catch (error) {
      console.error('Wishlist error:', error)
    }
  }

  const handleStockAlert = async () => {
    if (!product || !selectedSize) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/account/login'
      return
    }

    try {
      await fetch('/api/alerts/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          size: selectedSize,
          conditionCode: selectedCondition || null,
        })
      })
      setShowAlertModal(true)
      setTimeout(() => setShowAlertModal(false), 3000)
    } catch (error) {
      console.error('Stock alert error:', error)
    }
  }

  if (loading || !slug) {
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

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Product Not Found</h1>
            <p className="mt-2 text-[var(--text-secondary)]">The product you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/shop" className="btn-primary mt-6 inline-block">
              Back to Shop
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const dropStatus = getDropStatus(product)
  const isOutOfStock = !selectedVariant || (selectedVariant.stock - selectedVariant.reserved) <= 0

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm">
            <Link href="/shop" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              Shop
            </Link>
            <span className="text-[var(--text-muted)]">/</span>
            {product.brand && (
              <>
                <Link 
                  href={`/shop?brands=${encodeURIComponent(product.brand)}`}
                  className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {product.brand}
                </Link>
                <span className="text-[var(--text-muted)]">/</span>
              </>
            )}
            <span className="text-[var(--text-secondary)] truncate">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-[var(--bg-secondary)] rounded-lg overflow-hidden">
                {images.length > 0 ? (
                  <Image
                    src={images[selectedImage]?.url || images[0].url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-20 h-20 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.is_drop && dropStatus.status === 'live' && (
                    <span className="badge badge-new">LIVE DROP</span>
                  )}
                  {marketContext && selectedVariant && selectedVariant.price_cents < marketContext.avgPrice && (
                    <span className="px-2 py-1 bg-[var(--success)] text-white text-xs font-medium rounded">
                      BELOW AVG
                    </span>
                  )}
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={handleWishlist}
                  className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isWishlisted 
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-black/50 text-white hover:bg-black/70'
                  }`}
                >
                  <svg className="w-5 h-5" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={`relative aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                        selectedImage === index 
                          ? 'border-[var(--accent)]' 
                          : 'border-transparent hover:border-[var(--border-secondary)]'
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={`${product.name} view ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Builders */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                  <span className="text-lg">✓</span>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">100% Authentic</p>
                </div>
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                  <span className="text-lg">📦</span>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Secure Packaging</p>
                </div>
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                  <span className="text-lg">↩️</span>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">7-Day Returns</p>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="lg:py-4">
              {/* Brand */}
              {product.brand && (
                <p className="label-uppercase mb-2">{product.brand}</p>
              )}

              {/* Name */}
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">
                {product.name}
              </h1>

              {/* Price Range */}
              {priceRange && (
                <div className="mb-4">
                  {selectedVariant ? (
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold text-[var(--text-primary)]">
                        ${(selectedVariant.price_cents / 100).toFixed(0)} CAD
                      </span>
                      {marketContext && (
                        <span className="text-sm text-[var(--text-muted)]">
                          avg ${(marketContext.avgPrice / 100).toFixed(0)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-[var(--text-primary)]">
                      From ${(priceRange.min / 100).toFixed(0)} CAD
                    </span>
                  )}
                  {priceRange.min !== priceRange.max && !selectedVariant && (
                    <p className="text-sm text-[var(--text-muted)]">
                      ${(priceRange.min / 100).toFixed(0)} - ${(priceRange.max / 100).toFixed(0)} depending on size/condition
                    </p>
                  )}
                </div>
              )}

              {/* Market Context */}
              {marketContext && (
                <div className="flex flex-wrap gap-3 mb-6 text-sm">
                  <span className="px-3 py-1 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)]">
                    Last sold: ${(marketContext.lastSold / 100).toFixed(0)}
                  </span>
                  <span className="px-3 py-1 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)]">
                    Typical: ${(marketContext.lowestRecent / 100).toFixed(0)} - ${(marketContext.highestRecent / 100).toFixed(0)}
                  </span>
                </div>
              )}

              {/* Drop Status */}
              {product.is_drop && (
                <div className="mb-6 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
                  {dropStatus.status === 'upcoming' && (
                    <div>
                      <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">DROP STARTS IN</p>
                      <p className="text-2xl font-bold text-[var(--text-primary)] font-mono">{timeRemaining}</p>
                    </div>
                  )}
                  {dropStatus.status === 'live' && (
                    <div>
                      <p className="text-sm font-medium text-[var(--accent)] mb-1">🔥 DROP IS LIVE</p>
                      {timeRemaining && (
                        <p className="text-lg font-bold text-[var(--text-primary)] font-mono">Ends in {timeRemaining}</p>
                      )}
                    </div>
                  )}
                  {dropStatus.status === 'ended' && (
                    <p className="text-sm font-medium text-[var(--text-muted)]">This drop has ended</p>
                  )}
                </div>
              )}

              {/* Size/Condition Grid */}
              {variants.length > 0 && (
                <div className="mb-6 space-y-4">
                  {/* Size Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="label-uppercase">Select Size</p>
                      <SizingGuide brand={product.brand || ''} model={product.name} />
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {sizes.map((size) => {
                        const hasAnyAvailable = Object.values(sizeConditionGrid[size!] || {}).some(v => v !== null)
                        const isSelected = selectedSize === size

                        return (
                          <button
                            key={size}
                            onClick={() => {
                              setSelectedSize(size!)
                              // Auto-select first available condition for this size
                              const firstAvailable = Object.entries(sizeConditionGrid[size!] || {})
                                .find(([, variant]) => variant !== null)
                              if (firstAvailable) {
                                setSelectedCondition(firstAvailable[0])
                              }
                            }}
                            className={`relative py-3 px-2 text-center rounded-md border transition-all ${
                              isSelected
                                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)]'
                                : hasAnyAvailable
                                  ? 'border-[var(--border-secondary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:border-[var(--text-muted)]'
                                  : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed'
                            }`}
                          >
                            <span className="text-sm font-medium">{size}</span>
                            {!hasAnyAvailable && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <span className="w-full h-px bg-[var(--text-muted)] rotate-[-20deg]"></span>
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Condition Selection */}
                  {selectedSize && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="label-uppercase">Select Condition</p>
                        <ConditionGuide currentCondition={selectedCondition} />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {conditions.map((condition) => {
                          const variant = sizeConditionGrid[selectedSize]?.[condition!]
                          const isSelected = selectedCondition === condition

                          return (
                            <button
                              key={condition}
                              onClick={() => variant && setSelectedCondition(condition!)}
                              disabled={!variant}
                              className={`px-4 py-2 rounded-lg border transition-all ${
                                isSelected
                                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)]'
                                  : variant
                                    ? 'border-[var(--border-secondary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:border-[var(--text-muted)]'
                                    : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed'
                              }`}
                            >
                              <span className="text-sm font-medium">{condition}</span>
                              {variant && (
                                <span className="ml-2 text-sm text-[var(--text-muted)]">
                                  ${(variant.price_cents / 100).toFixed(0)}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Condition Guide Inline */}
                  {selectedCondition && (
                    <ConditionGuide currentCondition={selectedCondition} inline />
                  )}
                </div>
              )}

              {/* Stock Info */}
              {selectedVariant && (
                <div className="mb-6 text-sm text-[var(--text-muted)]">
                  {selectedVariant.stock - selectedVariant.reserved > 0 ? (
                    <span className="text-[var(--success)]">
                      ✓ {selectedVariant.stock - selectedVariant.reserved} in stock
                    </span>
                  ) : (
                    <span className="text-[var(--error)]">Out of stock</span>
                  )}
                </div>
              )}

              {/* Add to Cart / Stock Alert */}
              <div className="space-y-3 mb-8">
                {selectedVariant && dropStatus.isPurchasable && !isOutOfStock ? (
                  <button
                    onClick={handleAddToCart}
                    className={`w-full py-4 px-6 rounded-md font-medium text-lg transition-all ${
                      addedToCart
                        ? 'bg-[var(--success)] text-white'
                        : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
                    }`}
                  >
                    {addedToCart ? '✓ Added to Cart' : `Add to Cart - $${(selectedVariant.price_cents / 100).toFixed(0)}`}
                  </button>
                ) : (
                  <button
                    onClick={handleStockAlert}
                    className="w-full py-4 px-6 rounded-md font-medium text-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:border-[var(--accent)]"
                  >
                    🔔 Notify When Available
                  </button>
                )}
              </div>

              {/* Shipping Estimator */}
              <div className="mb-8">
                <ShippingEstimator priceCents={selectedVariant?.price_cents || priceRange?.min || 0} />
              </div>

              {/* What's Included */}
              <div className="mb-8 p-4 bg-[var(--bg-secondary)] rounded-lg">
                <h3 className="font-medium text-[var(--text-primary)] mb-3">What&apos;s Included</h3>
                <ul className="text-sm text-[var(--text-secondary)] space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-[var(--success)]">✓</span>
                    {selectedCondition === 'DS' ? 'Original box & all accessories' : 'Original box (when available)'}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[var(--success)]">✓</span>
                    Detailed condition photos provided
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[var(--success)]">✓</span>
                    Certificate of authenticity
                  </li>
                </ul>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-8">
                  <h3 className="font-medium text-[var(--text-primary)] mb-3">Description</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Policies */}
              <div className="grid grid-cols-2 gap-4">
                <Link href="/policies/returns" className="p-4 bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
                  <h4 className="font-medium text-[var(--text-primary)] mb-1">Returns</h4>
                  <p className="text-xs text-[var(--text-muted)]">7-day returns if item doesn&apos;t match description</p>
                </Link>
                <Link href="/policies/authenticity" className="p-4 bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
                  <h4 className="font-medium text-[var(--text-primary)] mb-1">Authenticity</h4>
                  <p className="text-xs text-[var(--text-muted)]">Every item verified by trained staff</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Stock Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
          <div className="bg-[var(--success)] text-white px-6 py-4 rounded-lg shadow-lg animate-fade-in pointer-events-auto">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔔</span>
              <div>
                <p className="font-medium">Alert Set!</p>
                <p className="text-sm opacity-90">We&apos;ll email you when this size is back in stock.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
