'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  brand: string
  slug: string
  lowest_price_cents: number
  primary_image: string | null
}

interface SimilarProductsProps {
  productId: string
  brand: string
  category?: string
}

export default function SimilarProducts({ productId, brand, category }: SimilarProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        const params = new URLSearchParams({
          excludeId: productId,
          brand,
          ...(category && { category }),
          limit: '4',
        })
        
        const response = await fetch(`/api/shop/similar?${params}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error('Error fetching similar products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSimilar()
  }, [productId, brand, category])

  if (loading || products.length === 0) {
    return null
  }

  return (
    <section className="py-12 border-t border-[var(--border-primary)]">
      <div className="container">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">You May Also Like</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map(product => (
            <Link 
              key={product.id}
              href={`/product/${product.slug}`}
              className="group"
            >
              <div className="relative aspect-square bg-[var(--bg-secondary)] rounded-lg overflow-hidden mb-3">
                {product.primary_image ? (
                  <img
                    src={product.primary_image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                    No Image
                  </div>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)]">{product.brand}</p>
              <h3 className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                {product.name}
              </h3>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">
                From ${(product.lowest_price_cents / 100).toFixed(0)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
