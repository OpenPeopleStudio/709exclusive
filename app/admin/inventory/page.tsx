'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Variant {
  id: string
  sku: string
  brand: string
  model: string
  size: string | null
  condition_code: string
  stock: number
  reserved: number
  available: number
}

interface AuditEntry {
  id: string
  variant_id: string
  delta: number
  reason: string
  actor: string
  created_at: string
  product_variants: {
    sku: string
  }
}

export default function AdminInventoryPage() {
  const [variants, setVariants] = useState<Variant[]>([])
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [adjusting, setAdjusting] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/inventory')
      if (response.ok) {
        const data = await response.json()
        setVariants(data.variants || [])
        setAuditHistory(data.auditHistory || [])
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStockAdjustment = async (
    variantId: string,
    adjustment: number,
    reason: string
  ) => {
    if (!reason.trim()) {
      alert('Please provide a reason for the adjustment')
      return
    }

    setAdjusting(variantId)
    try {
      const response = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variantId,
          adjustment,
          reason
        })
      })

      if (!response.ok) {
        throw new Error('Adjustment failed')
      }

      await fetchData() // Refresh data
    } catch (error) {
      console.error('Error adjusting inventory:', error)
      alert('Failed to adjust inventory')
    } finally {
      setAdjusting(null)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Inventory Management</h1>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Inventory Management</h1>
        <Link href="/admin/inventory/intake" className="btn-primary">
          + Add Inventory
        </Link>
      </div>

      {/* Current Inventory */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-[var(--border-primary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Current Inventory ({variants.length} variants)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Reserved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {variants.map((variant) => (
                <tr key={variant.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[var(--text-primary)]">
                    {variant.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[var(--text-primary)]">
                      {variant.brand} {variant.model}
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">
                      Size: {variant.size} • {variant.condition_code}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                    {variant.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                    {variant.reserved}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      variant.available > 10 ? 'bg-[var(--success)]/20 text-[var(--success)]' :
                      variant.available > 0 ? 'bg-[var(--warning)]/20 text-[var(--warning)]' :
                      'bg-[var(--error)]/20 text-[var(--error)]'
                    }`}>
                      {variant.available}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for stock increase:')
                          if (reason) {
                            handleStockAdjustment(variant.id, 1, reason)
                          }
                        }}
                        disabled={adjusting === variant.id}
                        className="text-[var(--success)] hover:text-[var(--success)]/80 disabled:opacity-50 font-medium"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for stock decrease:')
                          if (reason) {
                            handleStockAdjustment(variant.id, -1, reason)
                          }
                        }}
                        disabled={adjusting === variant.id}
                        className="text-[var(--error)] hover:text-[var(--error)]/80 disabled:opacity-50 font-medium"
                      >
                        -1
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit History */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-primary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Inventory Audit History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Actor
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {auditHistory.slice(0, 50).map((entry) => (
                <tr key={entry.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-muted)]">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[var(--text-primary)]">
                    {entry.product_variants.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      entry.delta > 0 ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--error)]/20 text-[var(--error)]'
                    }`}>
                      {entry.delta > 0 ? '+' : ''}{entry.delta}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)] max-w-xs truncate">
                    {entry.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-muted)]">
                    {entry.actor.slice(0, 8)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}