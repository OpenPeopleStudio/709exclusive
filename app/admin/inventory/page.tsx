'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'

interface Variant {
  id: string
  sku: string
  brand: string
  model: string
  size: string | null
  condition_code: string
  price_cents: number
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

type SortField = 'sku' | 'brand' | 'stock' | 'price_cents' | 'available'
type SortDirection = 'asc' | 'desc'

const CONDITION_OPTIONS = ['DS', 'VNDS', 'PADS', 'USED', 'BEATER']
const LOW_STOCK_THRESHOLD = 3

export default function AdminInventoryPage() {
  const [variants, setVariants] = useState<Variant[]>([])
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all')
  const [sortField, setSortField] = useState<SortField>('sku')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ price: string; stock: string }>({ price: '', stock: '' })
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showAuditPanel, setShowAuditPanel] = useState(false)
  const [saving, setSaving] = useState(false)

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

  // Get unique brands for filter
  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(variants.map(v => v.brand))].filter(Boolean).sort()
    return uniqueBrands
  }, [variants])

  // Filter and sort variants
  const filteredVariants = useMemo(() => {
    let result = [...variants]

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(v => 
        v.sku?.toLowerCase().includes(searchLower) ||
        v.brand?.toLowerCase().includes(searchLower) ||
        v.model?.toLowerCase().includes(searchLower) ||
        v.size?.toLowerCase().includes(searchLower)
      )
    }

    // Brand filter
    if (brandFilter) {
      result = result.filter(v => v.brand === brandFilter)
    }

    // Stock filter
    if (stockFilter === 'low') {
      result = result.filter(v => v.available > 0 && v.available <= LOW_STOCK_THRESHOLD)
    } else if (stockFilter === 'out') {
      result = result.filter(v => v.available === 0)
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      
      if (typeof aVal === 'string') aVal = aVal?.toLowerCase() || ''
      if (typeof bVal === 'string') bVal = bVal?.toLowerCase() || ''
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [variants, search, brandFilter, stockFilter, sortField, sortDirection])

  // Stats
  const stats = useMemo(() => {
    const totalValue = variants.reduce((sum, v) => sum + (v.price_cents * v.stock), 0)
    const totalUnits = variants.reduce((sum, v) => sum + v.stock, 0)
    const lowStockCount = variants.filter(v => v.available > 0 && v.available <= LOW_STOCK_THRESHOLD).length
    const outOfStockCount = variants.filter(v => v.available === 0).length
    return { totalValue, totalUnits, lowStockCount, outOfStockCount }
  }, [variants])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredVariants.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredVariants.map(v => v.id)))
    }
  }

  const startEdit = (variant: Variant) => {
    setEditingId(variant.id)
    setEditValues({
      price: (variant.price_cents / 100).toFixed(2),
      stock: variant.stock.toString()
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues({ price: '', stock: '' })
  }

  const saveEdit = async () => {
    if (!editingId) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/admin/inventory/variant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: editingId,
          updates: {
            price_cents: Math.round(parseFloat(editValues.price) * 100),
            stock: parseInt(editValues.stock)
          }
        })
      })

      if (response.ok) {
        await fetchData()
        cancelEdit()
      } else {
        alert('Failed to save changes')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const quickAdjust = async (variantId: string, delta: number) => {
    const reasons = delta > 0 
      ? ['Restock', 'Found item', 'Return accepted', 'Inventory correction']
      : ['Sold in-store', 'Damaged', 'Lost', 'Inventory correction']
    
    const reason = prompt(`Reason for ${delta > 0 ? 'adding' : 'removing'} ${Math.abs(delta)} unit(s):`, reasons[0])
    if (!reason) return

    try {
      const response = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, adjustment: delta, reason })
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Adjustment error:', error)
    }
  }

  const exportCSV = useCallback(() => {
    const headers = ['SKU', 'Brand', 'Model', 'Size', 'Condition', 'Price', 'Stock', 'Reserved', 'Available']
    const rows = filteredVariants.map(v => [
      v.sku,
      v.brand,
      v.model,
      v.size || '',
      v.condition_code,
      (v.price_cents / 100).toFixed(2),
      v.stock,
      v.reserved,
      v.available
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }, [filteredVariants])

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Inventory Management</h1>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-8 text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Inventory Management</h1>
          <p className="text-sm text-[var(--text-muted)]">{variants.length} variants total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAuditPanel(!showAuditPanel)} className="btn-secondary text-sm">
            {showAuditPanel ? 'Hide' : 'Show'} Audit Log
          </button>
          <button onClick={exportCSV} className="btn-secondary text-sm">
            Export CSV
          </button>
          <Link href="/admin/inventory/intake" className="btn-primary text-sm">
            + Add Inventory
          </Link>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            ${(stats.totalValue / 100).toLocaleString()}
          </p>
          <p className="text-sm text-[var(--text-muted)]">Total Value</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
          <p className="text-2xl font-bold text-[var(--success)]">{stats.totalUnits}</p>
          <p className="text-sm text-[var(--text-muted)]">Total Units</p>
        </div>
        <div 
          className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 cursor-pointer hover:border-[var(--warning)] transition-colors"
          onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
        >
          <p className="text-2xl font-bold text-[var(--warning)]">{stats.lowStockCount}</p>
          <p className="text-sm text-[var(--text-muted)]">Low Stock (&le;{LOW_STOCK_THRESHOLD})</p>
        </div>
        <div 
          className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 cursor-pointer hover:border-[var(--error)] transition-colors"
          onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
        >
          <p className="text-2xl font-bold text-[var(--error)]">{stats.outOfStockCount}</p>
          <p className="text-sm text-[var(--text-muted)]">Out of Stock</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SKU, brand, model, size..."
              className="pl-10 w-full"
            />
          </div>

          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="w-full sm:w-40"
          >
            <option value="">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
            className="w-full sm:w-36"
          >
            <option value="all">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        {/* Active Filters */}
        {(search || brandFilter || stockFilter !== 'all') && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border-primary)]">
            <span className="text-sm text-[var(--text-muted)]">Showing {filteredVariants.length} results</span>
            <button 
              onClick={() => { setSearch(''); setBrandFilter(''); setStockFilter('all') }}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg p-4 mb-4 flex items-center justify-between">
          <span className="text-sm text-[var(--text-primary)]">
            {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button onClick={() => setSelectedIds(new Set())} className="btn-secondary text-sm">
              Clear Selection
            </button>
            <button onClick={() => setShowBulkModal(true)} className="btn-primary text-sm">
              Bulk Actions
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredVariants.length && filteredVariants.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)]"
                  onClick={() => handleSort('sku')}
                >
                  SKU {sortField === 'sku' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)]"
                  onClick={() => handleSort('brand')}
                >
                  Details {sortField === 'brand' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)]"
                  onClick={() => handleSort('price_cents')}
                >
                  Price {sortField === 'price_cents' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)]"
                  onClick={() => handleSort('stock')}
                >
                  Stock {sortField === 'stock' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)]"
                  onClick={() => handleSort('available')}
                >
                  Avail {sortField === 'available' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filteredVariants.map((variant) => (
                <tr 
                  key={variant.id} 
                  className={`hover:bg-[var(--bg-tertiary)] transition-colors ${
                    variant.available === 0 ? 'bg-[var(--error)]/5' : 
                    variant.available <= LOW_STOCK_THRESHOLD ? 'bg-[var(--warning)]/5' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(variant.id)}
                      onChange={() => toggleSelect(variant.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-1 rounded">
                      {variant.sku}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {variant.brand} {variant.model}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      Size {variant.size} &bull; {variant.condition_code}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === variant.id ? (
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editValues.price}
                          onChange={(e) => setEditValues(v => ({ ...v, price: e.target.value }))}
                          className="pl-6 py-1 text-sm w-full"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        ${(variant.price_cents / 100).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === variant.id ? (
                      <input
                        type="number"
                        min="0"
                        value={editValues.stock}
                        onChange={(e) => setEditValues(v => ({ ...v, stock: e.target.value }))}
                        className="w-16 py-1 text-sm"
                      />
                    ) : (
                      <span className="text-sm text-[var(--text-secondary)]">
                        {variant.stock}
                        {variant.reserved > 0 && (
                          <span className="text-xs text-[var(--text-muted)] ml-1">
                            ({variant.reserved} res)
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      variant.available === 0 ? 'bg-[var(--error)]/20 text-[var(--error)]' :
                      variant.available <= LOW_STOCK_THRESHOLD ? 'bg-[var(--warning)]/20 text-[var(--warning)]' :
                      'bg-[var(--success)]/20 text-[var(--success)]'
                    }`}>
                      {variant.available}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === variant.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={saveEdit}
                          disabled={saving}
                          className="px-2 py-1 text-xs bg-[var(--success)] text-white rounded hover:bg-[var(--success)]/80"
                        >
                          {saving ? '...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-2 py-1 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded hover:bg-[var(--border-primary)]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => quickAdjust(variant.id, -1)}
                          className="w-7 h-7 flex items-center justify-center text-[var(--error)] hover:bg-[var(--error)]/10 rounded transition-colors"
                          title="Remove 1"
                        >
                          −
                        </button>
                        <button
                          onClick={() => quickAdjust(variant.id, 1)}
                          className="w-7 h-7 flex items-center justify-center text-[var(--success)] hover:bg-[var(--success)]/10 rounded transition-colors"
                          title="Add 1"
                        >
                          +
                        </button>
                        <button
                          onClick={() => startEdit(variant)}
                          className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredVariants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[var(--text-muted)]">
                    {variants.length === 0 ? 'No inventory yet. Add your first items to get started.' : 'No items match your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Panel */}
      {showAuditPanel && (
        <div className="mt-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
            <h2 className="font-semibold text-[var(--text-primary)]">Recent Inventory Changes</h2>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-tertiary)] sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">SKU</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Change</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {auditHistory.slice(0, 50).map((entry) => (
                  <tr key={entry.id} className="hover:bg-[var(--bg-tertiary)]">
                    <td className="px-4 py-2 text-xs text-[var(--text-muted)]">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <code className="text-xs font-mono text-[var(--text-secondary)]">
                        {entry.product_variants?.sku || 'Unknown'}
                      </code>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${
                        entry.delta > 0 ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--error)]/20 text-[var(--error)]'
                      }`}>
                        {entry.delta > 0 ? '+' : ''}{entry.delta}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-[var(--text-secondary)] max-w-xs truncate">
                      {entry.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkModal && (
        <BulkActionsModal
          selectedCount={selectedIds.size}
          onClose={() => setShowBulkModal(false)}
          onExecute={async (operation, value, reason) => {
            try {
              const response = await fetch('/api/admin/inventory/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  variantIds: Array.from(selectedIds),
                  operation,
                  value,
                  reason
                })
              })

              const data = await response.json()
              if (response.ok) {
                alert(`Updated ${data.updated} of ${data.total} items`)
                await fetchData()
                setSelectedIds(new Set())
                setShowBulkModal(false)
              } else {
                alert(data.error || 'Bulk operation failed')
              }
            } catch (error) {
              console.error('Bulk operation error:', error)
              alert('Bulk operation failed')
            }
          }}
        />
      )}
    </div>
  )
}

// Bulk Actions Modal Component
function BulkActionsModal({
  selectedCount,
  onClose,
  onExecute
}: {
  selectedCount: number
  onClose: () => void
  onExecute: (operation: string, value: number, reason?: string) => Promise<void>
}) {
  const [operation, setOperation] = useState('adjust_stock')
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')
  const [executing, setExecuting] = useState(false)

  const handleExecute = async () => {
    if (!value) {
      alert('Please enter a value')
      return
    }

    let numValue = parseFloat(value)
    
    // Convert dollars to cents for price operations
    if (operation === 'set_price' || operation === 'adjust_price_flat') {
      numValue = Math.round(numValue * 100)
    }

    setExecuting(true)
    await onExecute(operation, numValue, reason)
    setExecuting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Bulk Action ({selectedCount} items)
        </h2>

        <div className="space-y-4">
          <div>
            <label>Operation</label>
            <select value={operation} onChange={(e) => setOperation(e.target.value)}>
              <optgroup label="Stock">
                <option value="adjust_stock">Adjust Stock (+/-)</option>
                <option value="set_stock">Set Stock To</option>
              </optgroup>
              <optgroup label="Price">
                <option value="adjust_price_percent">Adjust Price by %</option>
                <option value="adjust_price_flat">Adjust Price by $</option>
                <option value="set_price">Set Price To</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label>
              {operation.includes('percent') ? 'Percentage' : 
               operation.includes('price') ? 'Amount ($)' : 'Quantity'}
            </label>
            <input
              type="number"
              step={operation.includes('price') && !operation.includes('percent') ? '0.01' : '1'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={operation.includes('percent') ? 'e.g., -10 for 10% off' : 'Enter value'}
            />
            {operation === 'adjust_price_percent' && (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Use negative for decrease (e.g., -10 for 10% off)
              </p>
            )}
          </div>

          {operation.includes('stock') && (
            <div>
              <label>Reason (for audit log)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., End of season clearance"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button 
            onClick={handleExecute} 
            disabled={executing || !value}
            className="btn-primary flex-1"
          >
            {executing ? 'Applying...' : 'Apply to All'}
          </button>
        </div>
      </div>
    </div>
  )
}
