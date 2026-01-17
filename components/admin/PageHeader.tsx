'use client'

import { ReactNode } from 'react'
import Button from '@/components/ui/Button'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  stats?: Array<{
    label: string
    value: string | number
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
  }>
}

export default function PageHeader({ title, subtitle, actions, stats }: PageHeaderProps) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm md:text-base text-[var(--text-muted)] mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-2">
            {actions}
          </div>
        )}
      </div>

      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl md:rounded-2xl p-4 md:p-5"
            >
              <div className="text-xs md:text-sm text-[var(--text-muted)] mb-1">
                {stat.label}
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
                  {stat.value}
                </div>
                {stat.trend && stat.trendValue && (
                  <div className={`text-xs flex items-center gap-1 ${
                    stat.trend === 'up' ? 'text-[var(--success)]' :
                    stat.trend === 'down' ? 'text-[var(--error)]' :
                    'text-[var(--text-muted)]'
                  }`}>
                    {stat.trend === 'up' && '↗'}
                    {stat.trend === 'down' && '↘'}
                    {stat.trend === 'neutral' && '→'}
                    {stat.trendValue}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
