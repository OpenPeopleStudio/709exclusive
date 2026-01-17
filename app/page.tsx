'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductCard, { ProductCardSkeleton, ProductCardData } from '@/components/ui/ProductCard'
import Button from '@/components/ui/Button'
import Surface from '@/components/ui/Surface'
import { useTenant } from '@/context/TenantContext'

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
  const { id: tenantId, settings } = useTenant()
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const authCheckedRef = useRef(false)
  const hero = settings?.content?.hero
  const featureCards = settings?.content?.features
  const brandName = settings?.theme?.brand_name || 'Shop'

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
      let productsQuery = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12)

      if (tenantId) {
        productsQuery = productsQuery.eq('tenant_id', tenantId)
      }

      const { data: productsData } = await productsQuery

      if (productsData) {
        // Fetch primary images
        let imagesQuery = supabase
          .from('product_images')
          .select('product_id, url, position')
          .in('product_id', productsData.map(p => p.id))
          .order('position')

        if (tenantId) {
          imagesQuery = imagesQuery.eq('tenant_id', tenantId)
        }

        const { data: imagesData } = await imagesQuery

        const imageMap: Record<string, string> = {}
        if (imagesData) {
          imagesData.forEach((img: ProductImage) => {
            if (!imageMap[img.product_id]) {
              imageMap[img.product_id] = img.url
            }
          })
        }

        // Fetch lowest prices
        let variantsQuery = supabase
          .from('product_variants')
          .select('product_id, price_cents')
          .in('product_id', productsData.map(p => p.id))

        if (tenantId) {
          variantsQuery = variantsQuery.eq('tenant_id', tenantId)
        }

        const { data: variantsData } = await variantsQuery

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
  }, [router, tenantId])

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
      <section className="pt-28 pb-16 md:pt-40 md:pb-24">
        <div className="container">
          <div className="max-w-3xl space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
              {hero?.eyebrow || brandName}
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-[var(--text-primary)] leading-tight">
              {hero?.headline || 'Authentic sneakers with local delivery and pickup.'}
            </h1>
            <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-xl">
              {hero?.subhead ||
                "A modern resale marketplace built for Newfoundland. Shop verified inventory, pay with card or crypto, and track every order in one place."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button href={hero?.primary_cta?.href || "/shop"} variant="primary">
                {hero?.primary_cta?.label || "Browse inventory"}
              </Button>
              <Button href={hero?.secondary_cta?.href || "/shop?sort=newest"} variant="secondary">
                {hero?.secondary_cta?.label || "New arrivals"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12 md:py-20 flex-1">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Latest</p>
              <h2 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)]">
                Recently added inventory
              </h2>
            </div>
            <Button href="/shop" variant="ghost">View all</Button>
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
      <section className="py-12 md:py-20 border-t border-[var(--border-primary)]">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {(featureCards && featureCards.length > 0 ? featureCards : [
              { title: 'Local delivery', description: "Same-day in St. John's with real-time order updates." },
              { title: 'Pickup ready', description: "Skip the wait and pick up in-store as soon as it's verified." },
              { title: 'Card + crypto', description: 'Pay with Stripe cards or NOWPayments crypto at checkout.' },
            ]).map((feature) => (
              <Surface key={feature.title} padding="lg">
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{feature.description}</p>
              </Surface>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
