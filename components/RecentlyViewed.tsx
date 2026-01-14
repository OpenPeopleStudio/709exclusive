'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface RecentProduct {
  id: string
  viewed_at: string
  product: {
    id: string
    name: string
    brand: string
    slug: string
    primary_image: string | null
    lowest_price_cents: number | null
    in_stock: boolean
  }
}

export default function RecentlyViewed() {
  const [items, setItems] = useState<RecentProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      try {
        const response = await fetch('/api/recently-viewed')
        if (response.ok) {
          const data = await response.json()
          setItems(data.items || [])
        }
      } catch (error) {
        console.error('Error fetching recently viewed:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentlyViewed()
  }, [])

  if (loading || items.length === 0) {
    return null
  }

  return (
    <section className="py-12 border-t border-[var(--border-primary)]">
      <div className="container">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Recently Viewed</h2>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {items.map(item => (
            <Link 
              key={item.id}
              href={`/product/${item.product.slug}`}
              className="flex-shrink-0 w-40 group"
            >
              <div className="relative aspect-square bg-[var(--bg-secondary)] rounded-lg overflow-hidden mb-2">
                {item.product.primary_image ? (
                  <img
                    src={item.product.primary_image}
                    alt={item.product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xs">
                    No Image
                  </div>
                )}
                {!item.product.in_stock && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">Out of Stock</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] truncate">{item.product.brand}</p>
              <p className="text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
                {item.product.name}
              </p>
              {item.product.lowest_price_cents && (
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  ${(item.product.lowest_price_cents / 100).toFixed(0)}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
