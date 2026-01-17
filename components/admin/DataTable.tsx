'use client'

import { ReactNode } from 'react'

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => ReactNode
  className?: string
  mobileHidden?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
  loading?: boolean
  emptyMessage?: string
  mobileCard?: (item: T) => ReactNode
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  loading,
  emptyMessage = 'No data available',
  mobileCard,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-8 text-center">
        <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-12 text-center">
        <p className="text-[var(--text-muted)]">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile card view */}
      {mobileCard && (
        <div className="md:hidden space-y-3">
          {data.map((item) => (
            <div
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={`bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 ${
                onRowClick ? 'cursor-pointer active:bg-[var(--bg-tertiary)] transition-colors' : ''
              }`}
            >
              {mobileCard(item)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop table view */}
      <div className={`${mobileCard ? 'hidden md:block' : 'block'} bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider ${
                      column.mobileHidden ? 'hidden lg:table-cell' : ''
                    } ${column.className || ''}`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`${
                    onRowClick
                      ? 'cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors'
                      : ''
                  }`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 md:px-6 py-3 md:py-4 text-sm text-[var(--text-primary)] ${
                        column.mobileHidden ? 'hidden lg:table-cell' : ''
                      } ${column.className || ''}`}
                    >
                      {column.render ? column.render(item) : String((item as any)[column.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
