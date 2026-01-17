'use client'

import { ReactNode } from 'react'

interface StatsCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  subtitle?: string
  onClick?: () => void
}

export default function StatsCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  subtitle,
  onClick,
}: StatsCardProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={`bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl md:rounded-2xl p-4 md:p-6 transition-all ${
        onClick ? 'cursor-pointer hover:border-[var(--accent)]/50 hover:shadow-lg active:scale-95' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs md:text-sm text-[var(--text-muted)] font-medium">
          {label}
        </div>
        {icon && (
          <div className="text-[var(--text-secondary)]">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <div className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
          {value}
        </div>
        {trend && trendValue && (
          <div className={`text-xs md:text-sm flex items-center gap-1 font-medium ${
            trend === 'up' ? 'text-[var(--success)]' :
            trend === 'down' ? 'text-[var(--error)]' :
            'text-[var(--text-muted)]'
          }`}>
            {trend === 'up' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            )}
            {trend === 'down' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            )}
            {trendValue}
          </div>
        )}
      </div>

      {subtitle && (
        <div className="text-xs text-[var(--text-muted)]">
          {subtitle}
        </div>
      )}
    </Component>
  )
}
