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
          <div className="w-12 h-12 border-3 border-transparent border-t-[var(--neon-magenta)] border-r-[var(--neon-cyan)] rounded-full animate-spin mx-auto mb-4 shadow-[0_0_30px_rgba(255,0,255,0.5)]"></div>
          <p className="text-[var(--text-secondary)] font-medium">Signing you in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--neon-magenta)]/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[var(--neon-cyan)]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container relative">
          <div className="max-w-4xl space-y-8">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-gradient animate-pulse">
              {hero?.eyebrow || brandName}
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-[var(--text-primary)] leading-[1.05] tracking-tight">
              {hero?.headline || (
                <>
                  Authentic sneakers <span className="text-gradient">with local delivery</span>
                </>
              )}
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              {hero?.subhead ||
                "A modern resale marketplace built for Newfoundland. Shop verified inventory, pay with card or crypto, and track every order in one place."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button href={hero?.primary_cta?.href || "/shop"} variant="primary">
                {hero?.primary_cta?.label || "Browse inventory"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
              <Button href={hero?.secondary_cta?.href || "/shop?sort=newest"} variant="secondary">
                {hero?.secondary_cta?.label || "New arrivals"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 md:py-24 flex-1">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-bold text-gradient mb-2">Latest</p>
              <h2 className="text-3xl md:text-4xl font-black text-[var(--text-primary)]">
                Recently added inventory
              </h2>
            </div>
            <Button href="/shop" variant="ghost">
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] flex items-center justify-center">
                <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-[var(--text-secondary)] mb-2 text-lg font-semibold">No products available yet</p>
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
      <section className="py-16 md:py-24 border-t border-[var(--glass-border)]">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {(featureCards && featureCards.length > 0 ? featureCards : [
              { 
                title: 'Local delivery', 
                description: "Same-day in St. John's with real-time order updates.",
                icon: '🚀'
              },
              { 
                title: 'Pickup ready', 
                description: "Skip the wait and pick up in-store as soon as it's verified.",
                icon: '⚡'
              },
              { 
                title: 'Card + crypto', 
                description: 'Pay with Stripe cards or NOWPayments crypto at checkout.',
                icon: '💎'
              },
            ]).map((feature) => (
              <Surface key={feature.title} padding="lg" className="group">
                <div className="mb-4 text-3xl">{feature.icon || '✨'}</div>
                <h3 className="font-bold text-xl text-[var(--text-primary)] mb-3 group-hover:text-gradient transition-all duration-300">{feature.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
              </Surface>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
