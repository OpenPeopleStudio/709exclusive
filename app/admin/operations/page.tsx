'use client'

import { useState, useMemo } from 'react'
import Surface from '@/components/ui/Surface'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import StaffLocationMap from '@/components/admin/StaffLocationMap'
import { useStaffLocations } from '@/hooks/useStaffLocations'

const formatRelative = (timestamp?: string | null) => {
  if (!timestamp) return 'Unknown'
  const diffMs = Date.now() - new Date(timestamp).getTime()
  if (diffMs < 60 * 1000) return 'Just now'
  const minutes = Math.round(diffMs / (60 * 1000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export default function OperationsPage() {
  const { 
    locations, 
    statusCounts, 
    loading, 
    error, 
    lastUpdated, 
    refetch 
  } = useStaffLocations({ autoRefresh: true, refreshInterval: 15000 })

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalStaff = locations.length
    const activeStaff = statusCounts.live + statusCounts.recent
    const coverage = totalStaff > 0 ? (activeStaff / totalStaff) * 100 : 0

    return {
      totalStaff,
      activeStaff,
      coverage: Math.round(coverage),
      liveNow: statusCounts.live,
    }
  }, [locations, statusCounts])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            Operations Center
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Advanced dispatch and routing dashboard with real-time tracking.
            {lastUpdated && (
              <span className="ml-2 text-[var(--text-muted)]">
                Last updated {formatRelative(lastUpdated.toISOString())}
              </span>
            )}
          </p>
        </div>

        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => refetch()}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Surface padding="md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Total Staff
            </span>
            <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">
            {metrics.totalStaff}
          </div>
        </Surface>

        <Surface padding="md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Active Now
            </span>
            <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-[var(--success)]">
            {metrics.activeStaff}
          </div>
        </Surface>

        <Surface padding="md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Live Tracking
            </span>
            <div className="w-3 h-3 rounded-full bg-[var(--success)] shadow-[0_0_12px_var(--success)] animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">
            {metrics.liveNow}
          </div>
        </Surface>

        <Surface padding="md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Coverage
            </span>
            <svg className="w-5 h-5 text-[var(--accent-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-[var(--accent-blue)]">
            {metrics.coverage}%
          </div>
        </Surface>
      </div>

      {/* Error Display */}
      {error && (
        <Surface padding="sm" className="border border-[var(--error)]/30 bg-[var(--error)]/10">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </Surface>
      )}

      {/* Main Map View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Compact Staff List */}
        <div className="lg:col-span-1 space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto pr-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Staff List
            </h3>
            <Badge variant="neutral">{locations.length}</Badge>
          </div>

          {locations.length === 0 ? (
            <Surface padding="md" variant="outline">
              <p className="text-xs text-[var(--text-muted)] text-center">
                No staff available
              </p>
            </Surface>
          ) : (
            locations.map((location) => (
              <button
                key={location.user_id}
                onClick={() => setSelectedUserId(location.user_id)}
                className={`w-full text-left transition-all duration-200 ${
                  selectedUserId === location.user_id ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                }`}
              >
                <Surface
                  padding="sm"
                  variant={selectedUserId === location.user_id ? 'elevated' : 'outline'}
                  className={selectedUserId === location.user_id ? 'border-[var(--accent)]' : ''}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      location.status === 'live' 
                        ? 'bg-[var(--success)] shadow-[0_0_8px_var(--success)] animate-pulse'
                        : location.status === 'recent'
                        ? 'bg-[var(--accent-blue)]'
                        : 'bg-[var(--accent-purple)]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {location.name || `Staff ${location.user_id.slice(-6)}`}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {formatRelative(location.recorded_at)}
                      </p>
                    </div>
                  </div>
                </Surface>
              </button>
            ))
          )}
        </div>

        {/* Large Map */}
        <div className="lg:col-span-3">
          <Surface padding="none" className="h-[calc(100vh-450px)]">
            <StaffLocationMap
              locations={locations}
              selectedUserId={selectedUserId}
              onSelectLocation={setSelectedUserId}
              className="w-full h-full"
            />
          </Surface>
        </div>
      </div>

      {/* Performance Metrics (Placeholder) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Surface padding="md">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Distance Today
          </h4>
          <div className="text-2xl font-bold text-[var(--accent-blue)] mb-1">
            —
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Coming soon
          </p>
        </Surface>

        <Surface padding="md">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Avg. Delivery Time
          </h4>
          <div className="text-2xl font-bold text-[var(--accent-purple)] mb-1">
            —
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Coming soon
          </p>
        </Surface>

        <Surface padding="md">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Deliveries Today
          </h4>
          <div className="text-2xl font-bold text-[var(--success)] mb-1">
            —
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Coming soon
          </p>
        </Surface>
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
        <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
        <span>Auto-refreshing every 15 seconds</span>
      </div>
    </div>
  )
}
