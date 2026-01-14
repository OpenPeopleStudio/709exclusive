'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Product {
  id: string
  name: string
  slug: string
  brand: string | null
  description: string | null
  is_drop: boolean
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
  const [products, setProducts] = useState<Product[]>([])
  const [images, setImages] = useState<Record<string, string>>({})
  const [prices, setPrices] = useState<Record<string, number>>({})
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
        const tokenType = params.get('type') // 'recovery', 'invite', 'signup', 'magiclink'

        // If this is a password recovery link, redirect to reset-password page
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

      if (productsData) {
        setProducts(productsData)

        // Fetch primary images for each product
        const { data: imagesData } = await supabase
          .from('product_images')
          .select('product_id, url, position')
          .in('product_id', productsData.map(p => p.id))
          .order('position')

        if (imagesData) {
          const imageMap: Record<string, string> = {}
          imagesData.forEach((img: ProductImage) => {
            if (!imageMap[img.product_id]) {
              imageMap[img.product_id] = img.url
            }
          })
          setImages(imageMap)
        }

        // Fetch lowest prices for each product
        const { data: variantsData } = await supabase
          .from('product_variants')
          .select('product_id, price_cents')
          .in('product_id', productsData.map(p => p.id))

        if (variantsData) {
          const priceMap: Record<string, number> = {}
          variantsData.forEach((v: ProductVariant) => {
            if (!priceMap[v.product_id] || v.price_cents < priceMap[v.product_id]) {
              priceMap[v.product_id] = v.price_cents
            }
          })
          setPrices(priceMap)
        }
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
      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-[var(--text-primary)] leading-[0.9]">
              AUTHENTIC
              <br />
              <span className="text-[var(--accent)]">SNEAKERS</span>
              <br />
              & STREETWEAR
            </h1>
            <p className="mt-6 text-lg text-[var(--text-secondary)] max-w-xl">
              St. John&apos;s premier destination for authentic kicks and exclusive drops.
            </p>
            <div className="mt-8">
              <a href="#products" className="btn-primary">
                Shop Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-16 md:py-24 flex-1">
        <div className="container">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
              Latest Drops
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="product-card">
                  <div className="product-card-image skeleton" style={{ aspectRatio: '1' }} />
                  <div className="product-card-body">
                    <div className="skeleton h-3 w-16 mb-2" />
                    <div className="skeleton h-4 w-full mb-2" />
                    <div className="skeleton h-5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--text-muted)]">No products available yet.</p>
              <Link href="/admin/products/new" className="btn-primary mt-6 inline-block">
                Add First Product
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <Link 
                  key={product.id} 
                  href={`/product/${product.slug}`}
                  className="product-card group"
                >
                  <div className="product-card-image">
                    {images[product.id] ? (
                      <Image
                        src={images[product.id]}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-tertiary)]">
                        <svg className="w-12 h-12 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {product.is_drop && (
                      <div className="absolute top-3 left-3">
                        <span className="badge badge-new">DROP</span>
                      </div>
                    )}
                  </div>
                  <div className="product-card-body">
                    {product.brand && (
                      <p className="product-card-brand">{product.brand}</p>
                    )}
                    <h3 className="product-card-name line-clamp-2">{product.name}</h3>
                    {prices[product.id] && (
                      <p className="product-card-price">
                        ${(prices[product.id] / 100).toFixed(0)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
