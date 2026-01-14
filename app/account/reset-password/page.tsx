'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function CustomerResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (!error) {
            setIsValidSession(true)
            window.history.replaceState(null, '', window.location.pathname)
          }
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setIsValidSession(true)
        }
      }
      setChecking(false)
    }

    checkSession()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Password updated successfully!')
        setTimeout(() => router.push('/account'), 2000)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-20 pb-16">
          <div className="w-full max-w-md px-6 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--error)]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Invalid or expired link</h1>
            <p className="text-[var(--text-secondary)] mb-8">Please request a new password reset link.</p>
            <Link href="/account/login" className="btn-primary">Back to Login</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center pt-20 pb-16">
        <div className="w-full max-w-md px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Set new password</h1>
            <p className="text-[var(--text-secondary)] mt-2">Enter your new password below</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label>New Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} />
            </div>
            <div>
              <label>Confirm Password</label>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" minLength={6} />
            </div>

            {error && (
              <div className="p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-md">
                <p className="text-sm text-[var(--error)]">{error}</p>
              </div>
            )}
            {message && (
              <div className="p-4 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-md">
                <p className="text-sm text-[var(--success)]">{message}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
