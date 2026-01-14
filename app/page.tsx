'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const router = useRouter()
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const [user, setUser] = useState<{ email?: string } | null>(null)

  useEffect(() => {
    // Check for auth hash fragment (from Supabase redirect)
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      setIsProcessingAuth(true)
      
      // Parse the hash and set session
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ error }) => {
          if (!error) {
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname)
            // Redirect to admin
            router.push('/admin/products')
          } else {
            setIsProcessingAuth(false)
          }
        })
      }
      return
    }

    // Check current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({ email: user.email })
      }
    })
  }, [router])

  if (isProcessingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Signing you in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">709exclusive</h1>
            </div>
            <nav className="flex space-x-8">
              <Link href="/admin/products" className="text-gray-600 hover:text-gray-900">Admin</Link>
              <Link href="/account/orders" className="text-gray-600 hover:text-gray-900">Orders</Link>
              <Link href="/cart" className="text-gray-600 hover:text-gray-900">Cart</Link>
              {user && (
                <span className="text-gray-500 text-sm">{user.email}</span>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Welcome to 709exclusive
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Your trusted destination for premium products. Discover our curated collection of high-quality items.
          </p>
          <div className="mt-8">
            <Link
              href="/admin/products"
              className="bg-indigo-600 text-white px-8 py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
