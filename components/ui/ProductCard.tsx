'use client'

import Link from 'next/link'
import Image from 'next/image'
import Badge from './Badge'

export interface ProductCardData {
  id: string
  name: string
  brand: string
  slug: string
  lowest_price_cents: number
  primary_image: string | null
  is_drop?: boolean
  drop_ends_at?: string | null
  created_at?: string
  last_sold_cents?: number | null
  sizes_available?: string[]
  conditions_available?: string[]
}

interface ProductCardProps {
  product: ProductCardData
  currentTime?: number
  showWishlist?: boolean
  onWishlistClick?: (productId: string) => void
  isWishlisted?: boolean
  /** Compact mode hides secondary info like sizes/conditions */
  compact?: boolean
  /** Size variant for different contexts */
  size?: 'default' | 'small'
}

export default function ProductCard({ 
  product, 
  currentTime = Date.now(),
  showWishlist = true,
  onWishlistClick,
  isWishlisted = false,
  compact = false,
  size = 'default'
}: ProductCardProps) {
  // Calculate badge states
  const isDropEnding = product.is_drop && product.drop_ends_at && 
    new Date(product.drop_ends_at).getTime() - currentTime < 24 * 60 * 60 * 1000
  
  const priceDropped = product.last_sold_cents && 
    product.lowest_price_cents < product.last_sold_cents
  
  const isNew = product.created_at && 
    new Date(product.created_at).getTime() > currentTime - 7 * 24 * 60 * 60 * 1000

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onWishlistClick?.(product.id)
  }

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      {/* Image Container */}
      <div className="relative aspect-square bg-[var(--bg-secondary)] rounded-2xl overflow-hidden mb-4 border border-[var(--glass-border)] group-hover:border-[var(--border-glow)] transition-all duration-300">
        {product.primary_image ? (
          <Image
            src={product.primary_image}
            alt={product.name}
            fill
            className="object-cover transition-all duration-500 group-hover:scale-110"
            sizes={size === 'small' ? '(max-width: 768px) 40vw, 200px' : '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
            <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges - Top Left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_drop && (
            isDropEnding 
              ? <Badge variant="time">Ending Soon</Badge>
              : <Badge variant="primary">Drop</Badge>
          )}
          {priceDropped && <Badge variant="success">Price Drop</Badge>}
          {isNew && !product.is_drop && <Badge variant="info">New</Badge>}
        </div>

        {/* Wishlist Button - Top Right */}
        {showWishlist && (
          <button
            onClick={handleWishlistClick}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-xl ${
              isWishlisted 
                ? 'bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)] opacity-100 shadow-[0_0_20px_rgba(255,0,255,0.5)]' 
                : 'bg-black/30 border border-white/20 opacity-0 group-hover:opacity-100'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg 
              className="w-4 h-4 text-white" 
              fill={isWishlisted ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className={`flex flex-col ${size === 'small' ? 'gap-1' : 'gap-2'}`}>
        {/* Brand */}
        <p className={`font-bold uppercase tracking-wider text-[var(--text-muted)] ${size === 'small' ? 'text-[10px] leading-tight' : 'text-xs leading-tight'}`}>
          {product.brand}
        </p>
        
        {/* Name - Fixed height container */}
        <div className={size === 'small' ? 'h-8' : 'h-10'}>
          <h3 className={`font-semibold text-[var(--text-primary)] group-hover:text-gradient transition-all duration-300 line-clamp-2 ${
            size === 'small' ? 'text-sm leading-4' : 'text-base leading-5'
          }`}>
            {product.name}
          </h3>
        </div>
        
        {/* Price - Fixed height to ensure alignment */}
        <div className={`flex items-center gap-2 ${size === 'small' ? 'h-6' : 'h-7'}`}>
          <span className={`font-bold bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)] bg-clip-text text-transparent ${size === 'small' ? 'text-base' : 'text-lg'}`}>
            ${(product.lowest_price_cents / 100).toFixed(0)}
          </span>
          {product.last_sold_cents && product.last_sold_cents !== product.lowest_price_cents && (
            <span className="text-sm text-[var(--text-muted)] line-through">
              ${(product.last_sold_cents / 100).toFixed(0)}
            </span>
          )}
        </div>

        {/* Secondary info (sizes, conditions) - hidden in compact mode and on mobile */}
        {!compact && product.sizes_available && product.sizes_available.length > 0 ? (
          <p className="text-xs text-[var(--text-muted)] hidden md:block h-4">
            {product.sizes_available.length} sizes available
          </p>
        ) : (
          !compact && <div className="h-4 hidden md:block" />
        )}
      </div>
    </Link>
  )
}

// Skeleton loader for ProductCard
export function ProductCardSkeleton({ size = 'default' }: { size?: 'default' | 'small' }) {
  return (
    <div className="animate-pulse">
      <div className="aspect-square bg-[var(--bg-secondary)] rounded-2xl mb-4 border border-[var(--glass-border)]" />
      <div className={`bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-tertiary)] to-[var(--bg-secondary)] bg-[length:200%_100%] animate-[skeleton-pulse_1.5s_ease-in-out_infinite] rounded w-1/3 mb-2 ${size === 'small' ? 'h-3' : 'h-4'}`} />
      <div className={`bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-tertiary)] to-[var(--bg-secondary)] bg-[length:200%_100%] animate-[skeleton-pulse_1.5s_ease-in-out_infinite] rounded w-2/3 mb-2 ${size === 'small' ? 'h-4' : 'h-5'}`} />
      <div className={`bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-tertiary)] to-[var(--bg-secondary)] bg-[length:200%_100%] animate-[skeleton-pulse_1.5s_ease-in-out_infinite] rounded w-1/4 ${size === 'small' ? 'h-3' : 'h-4'}`} />
    </div>
  )
}
