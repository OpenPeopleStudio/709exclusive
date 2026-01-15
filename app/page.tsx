'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductCard, { ProductCardSkeleton, ProductCardData } from '@/components/ui/ProductCard'

interface Product {
  id: string
  name: string
  slug: string
  brand: string | null
  description: string | null
  is_drop: boolean
  drop_ends_at: string | null
  created_at: string
}

interface ProductImage {
  product_id: string
  url: string
  position: number
}

interface ProductVariant {
  product_id: string
  price_cents: number
}

export default function Home() {
  const router = useRouter()
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const authCheckedRef = useRef(false)

  useEffect(() => {
    // Check for auth hash fragment (from Supabase redirect)
    const hash = window.location.hash
    if (hash && hash.includes('access_token') && !authCheckedRef.current) {
      authCheckedRef.current = true
      
      const handleAuth = async () => {
        setIsProcessingAuth(true)
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const tokenType = params.get('type')

        if (tokenType === 'recovery') {
          router.push(`/reset-password#${hash.substring(1)}`)
          return
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!error) {
            window.history.replaceState(null, '', window.location.pathname)
            router.push('/admin/products')
          } else {
            setIsProcessingAuth(false)
          }
        }
      }
      handleAuth()
      return
    }

    // Fetch products
    const fetchProducts = async () => {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12)

      if (productsData) {
        // Fetch primary images
        const { data: imagesData } = await supabase
          .from('product_images')
          .select('product_id, url, position')
          .in('product_id', productsData.map(p => p.id))
          .order('position')

        const imageMap: Record<string, string> = {}
        if (imagesData) {
          imagesData.forEach((img: ProductImage) => {
            if (!imageMap[img.product_id]) {
              imageMap[img.product_id] = img.url
            }
          })
        }

        // Fetch lowest prices
        const { data: variantsData } = await supabase
          .from('product_variants')
          .select('product_id, price_cents')
          .in('product_id', productsData.map(p => p.id))

        const priceMap: Record<string, number> = {}
        if (variantsData) {
          variantsData.forEach((v: ProductVariant) => {
            if (!priceMap[v.product_id] || v.price_cents < priceMap[v.product_id]) {
              priceMap[v.product_id] = v.price_cents
            }
          })
        }

        // Map to ProductCardData
        const mappedProducts: ProductCardData[] = productsData.map((product: Product) => ({
          id: product.id,
          name: product.name,
          brand: product.brand || '',
          slug: product.slug,
          lowest_price_cents: priceMap[product.id] || 0,
          primary_image: imageMap[product.id] || null,
          is_drop: product.is_drop,
          drop_ends_at: product.drop_ends_at,
          created_at: product.created_at,
        }))

        setProducts(mappedProducts)
      }

      setLoading(false)
    }

    fetchProducts()
  }, [router])

  if (isProcessingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Signing you in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-28">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-[var(--text-primary)] leading-[0.9]">
              AUTHENTIC
              <br />
              <span className="text-[var(--accent)]">SNEAKERS</span>
              <br />
              & STREETWEAR
            </h1>
            <p className="mt-6 md:mt-8 text-lg md:text-xl text-[var(--text-secondary)] max-w-xl">
              St. John&apos;s premier destination for authentic kicks and exclusive drops.
            </p>
            <div className="mt-8 md:mt-10 flex flex-wrap gap-4">
              <Link href="/shop" className="btn-primary">
                Shop All
              </Link>
              <Link href="/shop?drops=true" className="btn-secondary">
                View Drops
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 md:py-24 flex-1">
        <div className="container">
          <div className="flex items-center justify-between mb-10 md:mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
              Latest Arrivals
            </h2>
            <Link 
              href="/shop" 
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-[var(--text-muted)] mb-2">No products available yet</p>
              <p className="text-sm text-[var(--text-muted)]">Check back soon for new arrivals</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} compact />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 border-t border-[var(--border-primary)]">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center md:text-left">
              <div className="w-12 h-12 mx-auto md:mx-0 mb-4 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                <span className="text-xl">✓</span>
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">100% Authentic</h3>
              <p className="text-sm text-[var(--text-secondary)]">Every item verified by trained authenticators before shipping.</p>
            </div>
            <div className="text-center md:text-left">
              <div className="w-12 h-12 mx-auto md:mx-0 mb-4 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                <span className="text-xl">📦</span>
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Fast Shipping</h3>
              <p className="text-sm text-[var(--text-secondary)]">Free shipping on orders over $200 CAD across Canada.</p>
            </div>
            <div className="text-center md:text-left">
              <div className="w-12 h-12 mx-auto md:mx-0 mb-4 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                <span className="text-xl">↩️</span>
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Easy Returns</h3>
              <p className="text-sm text-[var(--text-secondary)]">7-day returns if the item doesn&apos;t match description.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
