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

export default function ProductPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedImage, setSelectedImage] = useState<number>(0)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [addedToCart, setAddedToCart] = useState(false)
  const { addToCart } = useCart()

  useEffect(() => {
    const fetchProduct = async () => {
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('slug', params.slug)
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

        if (variantsData && variantsData.length > 0) {
          // Select first available variant
          const available = variantsData.find(v => (v.stock - v.reserved) > 0)
          setSelectedVariant(available || variantsData[0])
        }
      }

      setLoading(false)
    }

    fetchProduct()
  }, [params.slug])

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

  const handleAddToCart = () => {
    if (selectedVariant) {
      addToCart(selectedVariant.id)
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 2000)
    }
  }

  if (loading) {
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
            <Link href="/" className="btn-primary mt-6 inline-block">
              Back to Shop
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const dropStatus = getDropStatus(product)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              ← Back to Shop
            </Link>
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
                {product.is_drop && dropStatus.status === 'live' && (
                  <div className="absolute top-4 left-4">
                    <span className="badge badge-new">LIVE DROP</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
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
                        sizes="100px"
                      />
                    </button>
                  ))}
                </div>
              )}
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

              {/* Price */}
              {selectedVariant && (
                <p className="text-3xl font-bold text-[var(--text-primary)] mb-6">
                  ${(selectedVariant.price_cents / 100).toFixed(2)}
                </p>
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

              {/* Size Selector */}
              {variants.length > 0 && (
                <div className="mb-6">
                  <p className="label-uppercase mb-3">Select Size</p>
                  <div className="grid grid-cols-4 gap-2">
                    {variants.map((variant) => {
                      const available = variant.stock - variant.reserved
                      const isDisabled = available <= 0 && dropStatus.isPurchasable
                      const isSelected = selectedVariant?.id === variant.id

                      return (
                        <button
                          key={variant.id}
                          onClick={() => !isDisabled && setSelectedVariant(variant)}
                          disabled={isDisabled}
                          className={`relative py-3 px-2 text-center rounded-md border transition-all ${
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)]'
                              : isDisabled
                                ? 'border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed'
                                : 'border-[var(--border-secondary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:border-[var(--text-muted)]'
                          }`}
                        >
                          <span className="text-sm font-medium">{variant.size || 'One Size'}</span>
                          {isDisabled && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="w-full h-px bg-[var(--text-muted)] rotate-[-20deg]"></span>
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Condition & Stock */}
              {selectedVariant && (
                <div className="mb-6 flex items-center gap-4 text-sm">
                  {selectedVariant.condition && (
                    <span className="text-[var(--text-secondary)]">
                      Condition: <span className="text-[var(--text-primary)] font-medium">{selectedVariant.condition}</span>
                    </span>
                  )}
                  <span className="text-[var(--text-muted)]">
                    {selectedVariant.stock - selectedVariant.reserved} available
                  </span>
                </div>
              )}

              {/* Add to Cart */}
              {selectedVariant && dropStatus.isPurchasable && (
                <button
                  onClick={handleAddToCart}
                  disabled={(selectedVariant.stock - selectedVariant.reserved) <= 0}
                  className={`w-full py-4 px-6 rounded-md font-medium text-lg transition-all ${
                    addedToCart
                      ? 'bg-[var(--success)] text-white'
                      : (selectedVariant.stock - selectedVariant.reserved) <= 0
                        ? 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed'
                        : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
                  }`}
                >
                  {addedToCart 
                    ? '✓ Added to Cart' 
                    : (selectedVariant.stock - selectedVariant.reserved) <= 0 
                      ? 'Out of Stock' 
                      : 'Add to Cart'
                  }
                </button>
              )}

              {/* Description */}
              {product.description && (
                <div className="mt-8 pt-8 border-t border-[var(--border-primary)]">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Description</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Disclaimer */}
              <p className="mt-6 text-xs text-[var(--text-muted)]">
                * Images represent the product model. Individual item condition is described separately.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
