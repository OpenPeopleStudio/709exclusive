'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Order {
  id: string
  status: string
  total_cents: number
  created_at: string
  tracking_number: string | null
  carrier: string | null
}

interface UserProfile {
  email: string
  full_name: string | null
}

export default function AccountPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAccount = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        window.location.href = '/account/login'
        return
      }

      setUser({
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || null
      })

      // Fetch recent orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setOrders(ordersData || [])
      setLoading(false)
    }

    loadAccount()
  }, [])

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-blue-500/20 text-blue-400'
      case 'fulfilled': return 'bg-[var(--warning)]/20 text-[var(--warning)]'
      case 'shipped': return 'bg-[var(--success)]/20 text-[var(--success)]'
      case 'delivered': return 'bg-[var(--success)]/20 text-[var(--success)]'
      case 'cancelled': return 'bg-[var(--error)]/20 text-[var(--error)]'
      default: return 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="container max-w-4xl">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
              Welcome back{user?.full_name ? `, ${user.full_name}` : ''}
            </h1>
            <p className="text-[var(--text-muted)] mt-1">{user?.email}</p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link 
              href="/account/orders"
              className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 hover:border-[var(--border-secondary)] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="font-medium text-[var(--text-primary)]">Order History</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">View all your past orders</p>
            </Link>

            <Link 
              href="/account/messages"
              className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 hover:border-[var(--border-secondary)] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-medium text-[var(--text-primary)]">Messages</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">Chat with the seller</p>
            </Link>

            <Link 
              href="/account/settings"
              className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 hover:border-[var(--border-secondary)] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-[var(--text-primary)]">Settings</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">Manage your account</p>
            </Link>
          </div>

          {/* Recent Orders */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-primary)] flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Orders</h2>
              <Link href="/account/orders" className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                View all →
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-[var(--text-muted)]">No orders yet</p>
                <Link href="/" className="btn-primary mt-4 inline-block">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-primary)]">
                {orders.map((order) => (
                  <Link 
                    key={order.id} 
                    href={`/account/orders/${order.id}`}
                    className="flex items-center justify-between p-4 hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        Order #{order.id.slice(-8)}
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusStyles(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="font-medium text-[var(--text-primary)]">
                        ${(order.total_cents / 100).toFixed(2)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
