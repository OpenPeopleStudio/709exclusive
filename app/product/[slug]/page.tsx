'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { useCart } from '@/context/CartContext'
import { getDropStatus, formatTimeRemaining } from '@/lib/drops'
import { Product, ProductVariant, ProductImage } from '@/types/database'

export default function ProductPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
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
          setSelectedVariant(variantsData[0])
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Product Not Found</h1>
            <p className="mt-4 text-gray-600">The product you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </div>
      </div>
    )
  }

  const dropStatus = getDropStatus(product)
  const primaryImage = images.find(img => img.position === 0) || images[0]

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {primaryImage && (
              <div className="relative w-full h-96">
                <Image
                  src={primaryImage.url}
                  alt={product.name}
                  fill
                  className="object-cover rounded-lg"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(1).map((image) => (
                  <div key={image.id} className="relative w-full h-20">
                    <Image
                      src={image.url}
                      alt={product.name}
                      fill
                      className="object-cover rounded cursor-pointer"
                      sizes="(max-width: 768px) 25vw, 10vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              {product.brand && (
                <p className="text-lg text-gray-600 mt-2">{product.brand}</p>
              )}
            </div>

            {/* Drop Status */}
            {product.is_drop && (
              <div className="bg-gray-50 p-4 rounded-lg">
                {dropStatus.status === 'upcoming' && (
                  <div className="text-center">
                    <p className="text-lg font-semibold text-blue-600">Drop Starting Soon</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{timeRemaining}</p>
                  </div>
                )}
                {dropStatus.status === 'live' && (
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">🔥 DROP LIVE 🔥</p>
                    {timeRemaining && (
                      <p className="text-sm text-gray-600 mt-1">Ends in {timeRemaining}</p>
                    )}
                  </div>
                )}
                {dropStatus.status === 'ended' && (
                  <div className="text-center">
                    <p className="text-lg font-semibold text-red-600">Drop Ended</p>
                  </div>
                )}
              </div>
            )}

            {/* Variants */}
            {variants.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Option</h3>
                <div className="space-y-2">
                  {variants.map((variant) => {
                    const available = variant.stock - variant.reserved
                    return (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        disabled={available <= 0 && dropStatus.isPurchasable}
                        className={`w-full p-3 border rounded-lg text-left ${
                          selectedVariant?.id === variant.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300 hover:border-gray-400'
                        } ${available <= 0 && dropStatus.isPurchasable ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{variant.sku}</p>
                            {variant.size && <p className="text-sm text-gray-600">Size: {variant.size}</p>}
                            {variant.condition && <p className="text-sm text-gray-600">Condition: {variant.condition}</p>}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${(variant.price_cents / 100).toFixed(2)}</p>
                            <p className="text-sm text-gray-600">{available} available</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            {selectedVariant && dropStatus.isPurchasable && (
              <button
                onClick={() => addToCart(selectedVariant.id)}
                disabled={(selectedVariant.stock - selectedVariant.reserved) <= 0}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(selectedVariant.stock - selectedVariant.reserved) <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            )}

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-600">{product.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  * Images represent the product model. Individual item condition is described separately.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}