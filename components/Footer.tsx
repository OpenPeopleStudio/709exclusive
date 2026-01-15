'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FooterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function FooterSection({ title, children, defaultOpen = false }: FooterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className="border-b border-[var(--border-primary)] md:border-0">
      {/* Mobile: Collapsible header */}
      <button 
        className="flex items-center justify-between w-full py-4 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="label-uppercase">{title}</span>
        <svg 
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Desktop: Static header */}
      <h4 className="label-uppercase mb-4 hidden md:block">{title}</h4>
      
      {/* Content */}
      <div className={`overflow-hidden transition-all duration-200 ease-out md:!max-h-none md:!opacity-100 md:!pb-0 ${
        isOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'
      }`}>
        {children}
      </div>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-primary)]">
      <div className="container py-8 md:py-16">
        {/* Mobile: Brand at top */}
        <div className="mb-6 pb-6 border-b border-[var(--border-primary)] md:hidden">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-black tracking-tighter text-[var(--text-primary)]">
              709
            </span>
          </Link>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Premium sneakers & streetwear. St. John&apos;s, NL.
          </p>
          
          {/* Social links for mobile */}
          <div className="flex items-center gap-4 mt-4">
            <a 
              href="https://instagram.com/709_exclusive" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-12">
          {/* Brand - Desktop only */}
          <div className="hidden md:block md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-black tracking-tighter text-[var(--text-primary)]">
                709
              </span>
            </Link>
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              Premium sneakers & streetwear.
              <br />
              St. John&apos;s, NL.
            </p>
          </div>

          {/* Shop */}
          <FooterSection title="Shop">
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  Drops
                </Link>
              </li>
            </ul>
          </FooterSection>

          {/* Support */}
          <FooterSection title="Support">
            <ul className="space-y-3">
              <li>
                <Link href="/account/orders" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  Order Status
                </Link>
              </li>
              <li>
                <span className="text-sm text-[var(--text-secondary)]">
                  Shipping & Returns
                </span>
              </li>
              <li>
                <a 
                  href="mailto:support@709exclusive.shop" 
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </FooterSection>

          {/* Connect - Desktop only (mobile shows social links at top) */}
          <div className="hidden md:block">
            <h4 className="label-uppercase mb-4">Connect</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://instagram.com/709_exclusive" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-[var(--border-primary)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[var(--text-muted)]">
              © {new Date().getFullYear()} 709exclusive. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-secondary)] transition-colors">
                Privacy Policy
              </span>
              <span className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-secondary)] transition-colors">
                Terms of Service
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
