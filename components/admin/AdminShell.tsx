'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import PWAInstallButton from './PWAInstallButton'
import { useTenant } from '@/context/TenantContext'

interface NavItem {
  href: string
  label: string
  icon: string
}

interface AdminShellProps {
  children: React.ReactNode
  userEmail?: string | null
  navItems: NavItem[]
  isSuperAdmin?: boolean
}

export default function AdminShell({ children, userEmail, navItems, isSuperAdmin = false }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { settings } = useTenant()
  const brandName = isSuperAdmin ? '709exclusive' : (settings?.theme?.brand_name || 'Store')
  const adminTitle = isSuperAdmin ? 'Super Admin' : 'Admin'

  const handleSignOut = async () => {
    if (isSigningOut) return
    setIsSigningOut(true)
    try {
      await supabase.auth.signOut()
      setIsSidebarOpen(false)
      router.push('/')
      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] flex items-center justify-between px-4 lg:hidden">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-lg font-bold text-[var(--text-primary)]">{brandName} {adminTitle}</span>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href={isSuperAdmin ? "/super-admin/tenants" : "/admin/products"} className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter text-[var(--text-primary)]">{brandName}</span>
            <span className="text-sm font-medium text-[var(--text-muted)]">{adminTitle}</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <PWAInstallButton />
          <span className="text-sm text-[var(--text-muted)]">{userEmail}</span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={`text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ${
              isSigningOut ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            Sign out
          </button>
          {!isSuperAdmin && (
            <Link 
              href="/" 
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              View Store →
            </Link>
          )}
        </div>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] overflow-y-auto transition-transform duration-300 ease-in-out
        lg:top-16 lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border-primary)] lg:hidden">
           <span className="text-xl font-black tracking-tighter text-[var(--text-primary)]">{brandName} {adminTitle}</span>
           <button 
             onClick={() => setIsSidebarOpen(false)}
             className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${
                  isActive 
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <svg 
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        
        {/* Mobile footer links */}
        <div className="p-4 border-t border-[var(--border-primary)] lg:hidden mt-auto">
           <div className="flex items-center gap-3 mb-4">
             {userEmail && (
               <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                 {userEmail[0].toUpperCase()}
               </div>
             )}
             <div className="flex-1 min-w-0">
               <p className="text-sm font-medium text-[var(--text-primary)] truncate">{userEmail}</p>
             </div>
           </div>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={`block w-full text-center px-4 py-2 border border-[var(--border-primary)] rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors ${
                isSigningOut ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              Sign out
            </button>
            {!isSuperAdmin && (
              <Link 
               href="/" 
               className="block w-full text-center px-4 py-2 border border-[var(--border-primary)] rounded-md text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                View Store
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 min-h-screen transition-all duration-300">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}