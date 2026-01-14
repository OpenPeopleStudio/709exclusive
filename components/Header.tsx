'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

export default function Header() {
  const { itemCount } = useCart()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-[var(--bg-primary)]/80 backdrop-blur-xl' 
            : 'bg-transparent'
        }`}
      >
        <div className="container">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="group flex items-center gap-1">
              <span className="text-3xl font-black tracking-[-0.08em] text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                709
              </span>
            </Link>

            {/* Center Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              <Link 
                href="/" 
                className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-white/5"
              >
                Shop
              </Link>
              <Link 
                href="/account/orders" 
                className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-white/5"
              >
                Orders
              </Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Cart */}
              <Link 
                href="/cart" 
                className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5 transition-colors"
              >
                <svg 
                  className="w-[22px] h-[22px] text-[var(--text-primary)]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" 
                  />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[var(--accent)] text-white text-[10px] font-bold rounded-full px-1">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {/* Account */}
              <Link 
                href="/account/login" 
                className="hidden md:flex px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-white/5"
              >
                Account
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <svg 
                  className="w-5 h-5 text-[var(--text-primary)]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[var(--bg-primary)]/95 backdrop-blur-xl md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="container pt-24">
            <nav className="flex flex-col gap-2">
              <Link 
                href="/" 
                className="text-2xl font-medium text-[var(--text-primary)] py-4 border-b border-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Shop
              </Link>
              <Link 
                href="/account/orders" 
                className="text-2xl font-medium text-[var(--text-primary)] py-4 border-b border-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Orders
              </Link>
              <Link 
                href="/cart" 
                className="text-2xl font-medium text-[var(--text-primary)] py-4 border-b border-white/10 flex items-center justify-between"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Cart
                {itemCount > 0 && (
                  <span className="text-base text-[var(--text-muted)]">{itemCount} items</span>
                )}
              </Link>
              <Link 
                href="/account/login" 
                className="text-2xl font-medium text-[var(--text-muted)] py-4"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Account
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
