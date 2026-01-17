'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useE2EEncryption } from '@/hooks/useE2EEncryption'
import EncryptionLockScreen from '@/components/EncryptionLockScreen'

interface Customer {
  id: string
  email: string | null
  name: string | null
  phone: string | null
  created: number
  orderCount: number
  eligibleOrderCount: number
  hasPurchase: boolean
  totalSpent: number
  lastOrder: string | null
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [purchaseFilter, setPurchaseFilter] = useState<'all' | 'buyers' | 'window'>('all')
  const [adminId, setAdminId] = useState<string | null>(null)

  const { isLocked, unlockKeys, error: encryptionError } = useE2EEncryption(adminId)

  useEffect(() => {
    const getAdminId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setAdminId(user.id)
      }
    }
    getAdminId()
  }, [])

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/admin/customers')
        if (response.ok) {
          const data = await response.json()
          setCustomers(data.customers || [])
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to fetch customers')
        }
      } catch (err) {
        console.error('Error fetching customers:', err)
        setError('Failed to fetch customers')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter(customer => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = (
      customer.email?.toLowerCase().includes(search) ||
      customer.name?.toLowerCase().includes(search) ||
      customer.phone?.includes(search)
    )
    if (!matchesSearch) return false
    if (purchaseFilter === 'buyers') return customer.hasPurchase
    if (purchaseFilter === 'window') return !customer.hasPurchase
    return true
  })

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const totalOrders = customers.reduce((sum, c) => sum + c.orderCount, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const buyerCount = customers.filter((c) => c.hasPurchase).length
  const windowShopperCount = customers.length - buyerCount

  // Show lock screen if encryption is locked
  if (isLocked) {
    return <EncryptionLockScreen onUnlock={unlockKeys} error={encryptionError} />
  }

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Customers</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
              <div className="skeleton h-8 w-16 mb-2"></div>
              <div className="skeleton h-4 w-24"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-8">Customers</h1>
        <div className="bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg p-6">
          <p className="text-[var(--error)]">{error}</p>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Make sure your Stripe API key is configured correctly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Customers</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <p className="text-3xl font-bold text-[var(--text-primary)]">{customers.length}</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Total Customers</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <p className="text-3xl font-bold text-[var(--success)]">${(totalRevenue / 100).toFixed(0)}</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Total Revenue</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <p className="text-3xl font-bold text-[var(--accent)]">{totalOrders}</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Total Orders</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <p className="text-3xl font-bold text-[var(--text-primary)]">${(avgOrderValue / 100).toFixed(0)}</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Avg Order Value</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setPurchaseFilter('all')}
            className={`px-3 py-1 rounded-full border ${
              purchaseFilter === 'all'
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setPurchaseFilter('buyers')}
            className={`px-3 py-1 rounded-full border ${
              purchaseFilter === 'buyers'
                ? 'border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]'
                : 'border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Buyers ({buyerCount})
          </button>
          <button
            type="button"
            onClick={() => setPurchaseFilter('window')}
            className={`px-3 py-1 rounded-full border ${
              purchaseFilter === 'window'
                ? 'border-[var(--warning)] bg-[var(--warning)]/10 text-[var(--warning)]'
                : 'border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Window shoppers ({windowShopperCount})
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-primary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            All Customers ({filteredCustomers.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/customers/${customer.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {(customer.name || customer.email || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
                          {customer.name || 'No name'}
                        </p>
                        <p className="text-sm text-[var(--text-muted)]">
                          {customer.email || 'No email'}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                    {customer.phone || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      customer.orderCount > 0 
                        ? 'bg-[var(--success)]/20 text-[var(--success)]' 
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                    }`}>
                      {customer.orderCount} orders
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      customer.hasPurchase
                        ? 'bg-[var(--success)]/20 text-[var(--success)]'
                        : 'bg-[var(--warning)]/15 text-[var(--warning)]'
                    }`}>
                      {customer.hasPurchase ? 'Buyer' : 'Window shopper'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-[var(--text-primary)]">
                      ${(customer.totalSpent / 100).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                    {new Date(customer.created * 1000).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    {searchTerm ? 'No customers match your search.' : 'No customers yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
