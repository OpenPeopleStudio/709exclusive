'use client'

import { useState, useEffect } from 'react'
import { useTenant } from '@/context/TenantContext'

export default function ComingSoon() {
  const { settings } = useTenant()
  const brandName = settings?.theme?.brand_name || '709 Exclusive'
  const logoUrl = settings?.theme?.logo_url
  
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || status === 'loading') return

    setStatus('loading')
    
    // Simulate API call - store in localStorage for now
    await new Promise(resolve => setTimeout(resolve, 800))
    
    try {
      const stored = JSON.parse(localStorage.getItem('coming_soon_signups') || '[]')
      stored.push({ email: email.toLowerCase().trim(), timestamp: new Date().toISOString() })
      localStorage.setItem('coming_soon_signups', JSON.stringify(stored))
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Main gradient orb */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, var(--neon-magenta) 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'pulse-slow 8s ease-in-out infinite',
          }}
        />
        
        {/* Secondary orb */}
        <div 
          className="absolute top-1/4 right-1/4 w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, var(--neon-cyan) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'float 6s ease-in-out infinite',
          }}
        />
        
        {/* Tertiary orb */}
        <div 
          className="absolute bottom-1/4 left-1/4 w-[250px] h-[250px] md:w-[350px] md:h-[350px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, var(--neon-purple) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'float 7s ease-in-out infinite reverse',
          }}
        />

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(var(--text-muted) 1px, transparent 1px),
              linear-gradient(90deg, var(--text-muted) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Noise texture */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          }}
        />
      </div>

      {/* Content */}
      <div 
        className={`relative z-10 max-w-2xl mx-auto text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        {/* Logo */}
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={brandName}
            className="h-16 md:h-20 mx-auto mb-8 object-contain"
          />
        ) : (
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              <span className="text-gradient">{brandName}</span>
            </h2>
          </div>
        )}

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--neon-cyan)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--neon-cyan)]"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Launching Soon</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-6">
          <span className="text-[var(--text-primary)]">Something</span>
          <br />
          <span className="text-gradient">Exclusive</span>
          <br />
          <span className="text-[var(--text-primary)]">is Coming</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-lg mx-auto mb-10 leading-relaxed">
          We&apos;re building something special. Be the first to know when we launch.
        </p>

        {/* Email Signup Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
          <div className="relative group">
            {/* Glow effect behind input */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)] rounded-2xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity" />
            
            <div className="relative flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={status === 'loading' || status === 'success'}
                className="flex-1 px-5 py-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-glow)] focus:ring-2 focus:ring-[var(--neon-magenta)]/20 transition-all disabled:opacity-50 text-base"
              />
              <button
                type="submit"
                disabled={status === 'loading' || status === 'success' || !email}
                className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)] text-white shadow-[0_0_30px_rgba(255,0,255,0.3)] hover:shadow-[0_0_50px_rgba(255,0,255,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-[0_0_30px_rgba(255,0,255,0.3)] flex items-center justify-center gap-2 min-w-[140px]"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </>
                ) : status === 'success' ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Done</span>
                  </>
                ) : (
                  'Notify Me'
                )}
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {status === 'success' && (
            <p className="mt-4 text-sm text-[var(--success)] font-medium animate-fade-in">
              You&apos;re on the list! We&apos;ll notify you when we launch.
            </p>
          )}
          {status === 'error' && (
            <p className="mt-4 text-sm text-[var(--error)] font-medium animate-fade-in">
              Something went wrong. Please try again.
            </p>
          )}
        </form>

        {/* Privacy note */}
        <p className="text-xs text-[var(--text-muted)]">
          No spam, ever. Unsubscribe anytime.
        </p>

        {/* Social Links (optional - can be customized) */}
        <div className="mt-12 flex items-center justify-center gap-6">
          <a 
            href="#" 
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Instagram"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a 
            href="#" 
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Twitter/X"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a 
            href="#" 
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="TikTok"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--neon-magenta)]/50 to-transparent" />

      {/* Inline styles for custom animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.2;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  )
}
