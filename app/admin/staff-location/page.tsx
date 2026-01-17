'use client'

import { useEffect, useMemo, useState } from 'react'
import Surface from '@/components/ui/Surface'
import Button from '@/components/ui/Button'
import Badge, { type BadgeVariant } from '@/components/ui/Badge'

type TrailPoint = {
  lat: number
  lng: number
  accuracy_m: number | null
  recorded_at: string
}

type StaffLocation = {
  user_id: string
  name: string | null
  latest: TrailPoint | null
  trail: TrailPoint[]
}

type ApiResponse = {
  staff: StaffLocation[]
  window_hours: number
  max_per_staff: number
}

const REFRESH_INTERVAL_MS = 30 * 1000
const LIVE_THRESHOLD_MS = 2 * 60 * 1000
const RECENT_THRESHOLD_MS = 10 * 60 * 1000

type StatusFilter = 'all' | 'live' | 'recent' | 'stale'
type StatusType = 'live' | 'recent' | 'stale' | 'unknown'

const statusLabel: Record<StatusType, string> = {
  live: 'Live',
  recent: 'Recent',
  stale: 'Stale',
  unknown: 'Unknown',
}

const statusVariant: Record<StatusType, BadgeVariant> = {
  live: 'success',
  recent: 'time',
  stale: 'neutral',
  unknown: 'neutral',
}

const getStatus = (timestamp?: string | null): StatusType => {
  if (!timestamp) return 'unknown'
  const diffMs = Date.now() - new Date(timestamp).getTime()
  if (diffMs <= LIVE_THRESHOLD_MS) return 'live'
  if (diffMs <= RECENT_THRESHOLD_MS) return 'recent'
  return 'stale'
}

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

const formatTimestamp = (timestamp?: string | null) =>
  timestamp ? new Date(timestamp).toLocaleString() : '—'

export default function StaffLocationPage() {
  const [staff, setStaff] = useState<StaffLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [purging, setPurging] = useState(false)
  const [purgeMessage, setPurgeMessage] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const fetchLocations = async () => {
    setError(null)
    setLoading(true)
    try {
      const response = await fetch('/api/staff/location?windowHours=48&maxPerStaff=60&limit=2000')
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Unable to load locations')
      }
      const data = (await response.json()) as ApiResponse
      setStaff(data.staff || [])
      setLastUpdated(new Date().toISOString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load locations')
    } finally {
      setLoading(false)
    }
  }

  const purgeExpired = async () => {
    setPurgeMessage(null)
    setPurging(true)
    try {
      const response = await fetch('/api/admin/staff/location/cleanup', { method: 'POST' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to purge locations')
      }
      setPurgeMessage(`Purged ${payload.deleted || 0} expired points.`)
      await fetchLocations()
    } catch (err) {
      setPurgeMessage(err instanceof Error ? err.message : 'Unable to purge locations')
    } finally {
      setPurging(false)
    }
  }

  useEffect(() => {
    fetchLocations()
    const interval = setInterval(fetchLocations, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const statusCounts = useMemo(() => {
    return staff.reduce(
      (acc, entry) => {
        const status = getStatus(entry.latest?.recorded_at)
        if (status === 'live') acc.live += 1
        if (status === 'recent') acc.recent += 1
        if (status === 'stale') acc.stale += 1
        return acc
      },
      { live: 0, recent: 0, stale: 0 }
    )
  }, [staff])

  const filteredStaff = useMemo(() => {
    if (statusFilter === 'all') return staff
    return staff.filter((entry) => getStatus(entry.latest?.recorded_at) === statusFilter)
  }, [staff, statusFilter])

  const selected = useMemo(() => {
    if (selectedId) {
      return filteredStaff.find((entry) => entry.user_id === selectedId) || filteredStaff[0] || null
    }
    return filteredStaff[0] || null
  }, [filteredStaff, selectedId])

  const mapUrl = useMemo(() => {
    if (!selected?.latest) return null
    const { lat, lng } = selected.latest
    const delta = 0.01
    const bbox = [
      (lng - delta).toFixed(6),
      (lat - delta).toFixed(6),
      (lng + delta).toFixed(6),
      (lat + delta).toFixed(6),
    ].join('%2C')
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
  }, [selected])

  const selectedStatus = selected?.latest ? getStatus(selected.latest.recorded_at) : 'unknown'

  const emptyMessage = statusFilter === 'all'
    ? 'No active staff locations yet. Ask staff to opt in and share their location.'
    : 'No staff locations match this filter.'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Delivery ops</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Live delivery tracking with recent history. Auto-refreshes every 30 seconds.
            {' '}
            Last refreshed {formatRelative(lastUpdated)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={fetchLocations} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button variant="ghost" size="sm" onClick={purgeExpired} disabled={purging}>
            {purging ? 'Purging…' : 'Purge expired'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-[var(--text-muted)]">
          <span>Live: {statusCounts.live}</span>
          <span>Recent: {statusCounts.recent}</span>
          <span>Stale: {statusCounts.stale}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'live' ? 'secondary' : 'ghost'}
            onClick={() => setStatusFilter('live')}
          >
            Live
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'recent' ? 'secondary' : 'ghost'}
            onClick={() => setStatusFilter('recent')}
          >
            Recent
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'stale' ? 'secondary' : 'ghost'}
            onClick={() => setStatusFilter('stale')}
          >
            Stale
          </Button>
        </div>
      </div>

      {error && (
        <Surface padding="sm" className="border border-[var(--error)]/30 bg-[var(--error)]/10">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </Surface>
      )}

      {purgeMessage && (
        <Surface padding="sm" className="border border-[var(--border-primary)]">
          <p className="text-sm text-[var(--text-secondary)]">{purgeMessage}</p>
        </Surface>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Surface padding="md" className="lg:col-span-2 space-y-4">
          {filteredStaff.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              {emptyMessage}
            </p>
          ) : (
            filteredStaff.map((entry) => {
              const status = getStatus(entry.latest?.recorded_at)
              return (
                <button
                  key={entry.user_id}
                  type="button"
                  onClick={() => setSelectedId(entry.user_id)}
                  className={`w-full text-left border border-[var(--border-primary)] rounded-lg p-4 transition-colors ${
                    selected?.user_id === entry.user_id
                      ? 'bg-[var(--bg-tertiary)]'
                      : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {entry.name || `Staff ${entry.user_id.slice(-6)}`}
                        </p>
                        <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Last update: {formatTimestamp(entry.latest?.recorded_at)} ({formatRelative(entry.latest?.recorded_at)})
                      </p>
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {entry.latest
                        ? `±${Math.round(entry.latest.accuracy_m || 0)}m`
                        : '—'}
                    </div>
                  </div>

                  {entry.latest && (
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                      <span>{entry.latest.lat.toFixed(5)}, {entry.latest.lng.toFixed(5)}</span>
                      <a
                        href={`https://www.google.com/maps?q=${entry.latest.lat},${entry.latest.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--accent)] hover:text-[var(--accent-hover)]"
                      >
                        Open in Maps
                      </a>
                    </div>
                  )}

                  {entry.trail.length > 0 && (
                    <div className="mt-4 grid gap-2 text-xs text-[var(--text-muted)]">
                      {entry.trail.slice(-5).map((point, index) => (
                        <div key={`${point.recorded_at}-${index}`} className="flex items-center justify-between">
                          <span>{formatTimestamp(point.recorded_at)}</span>
                          <span>{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              )
            })
          )}
        </Surface>

        <Surface padding="md" className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Map preview</h2>
          {selected?.latest ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>Showing {selected.name || `Staff ${selected.user_id.slice(-6)}`}</span>
                <Badge variant={statusVariant[selectedStatus]}>{statusLabel[selectedStatus]}</Badge>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Last seen {formatRelative(selected.latest.recorded_at)} at {formatTimestamp(selected.latest.recorded_at)}
              </div>
              <div className="rounded-lg overflow-hidden border border-[var(--border-primary)]">
                {mapUrl ? (
                  <iframe
                    title="Staff location map"
                    src={mapUrl}
                    className="w-full h-64"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-[var(--text-muted)]">
                    Map unavailable
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              Select a staff member to preview their last known location.
            </p>
          )}
        </Surface>
      </div>
    </div>
  )
}
