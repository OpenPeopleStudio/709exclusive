'use client'

import { useEffect, useRef, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Surface from '@/components/ui/Surface'
import Button from '@/components/ui/Button'

const UPDATE_INTERVAL_MS = 3 * 60 * 1000
const RETENTION_HOURS = 48

type LocationEvent = 'start' | 'stop'

type StaffLocationClientProps = {
  staffName: string
}

export default function StaffLocationClient({ staffName }: StaffLocationClientProps) {
  const [tracking, setTracking] = useState(false)
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
  const [lastSentAt, setLastSentAt] = useState<string | null>(null)
  const [lastAccuracy, setLastAccuracy] = useState<number | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startLoggedRef = useRef(false)

  useEffect(() => {
    if (typeof navigator === 'undefined') return

    if (!('geolocation' in navigator)) {
      setError('Location services are not available on this device.')
      return
    }

    if ('permissions' in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((status) => {
          setPermission(status.state)
          status.onchange = () => setPermission(status.state)
        })
        .catch(() => {})
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const sendTrackingEvent = async (event: LocationEvent) => {
    try {
      await fetch('/api/staff/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event }),
      })
    } catch {
      // Best-effort logging only.
    }
  }

  const sendLocation = async (position: GeolocationPosition, event?: LocationEvent) => {
    const { latitude, longitude, accuracy } = position.coords
    setIsSending(true)
    setError(null)

    try {
      const response = await fetch('/api/staff/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: latitude,
          lng: longitude,
          accuracy,
          recordedAt: new Date(position.timestamp).toISOString(),
          event,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Unable to update location')
      }

      setLastSentAt(new Date().toISOString())
      setLastAccuracy(Number.isFinite(accuracy) ? accuracy : null)
      if (event === 'start') {
        startLoggedRef.current = true
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update location')
    } finally {
      setIsSending(false)
    }
  }

  const requestPosition = (event?: LocationEvent) => {
    if (!('geolocation' in navigator)) {
      setError('Location services are not available on this device.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void sendLocation(position, event)
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setPermission('denied')
          setTracking(false)
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }
        setError(geoError.message || 'Unable to read location')
      },
      {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 60000,
      }
    )
  }

  const startTracking = () => {
    if (tracking) return
    setTracking(true)
    startLoggedRef.current = false
    requestPosition('start')

    intervalRef.current = setInterval(() => {
      requestPosition(startLoggedRef.current ? undefined : 'start')
    }, UPDATE_INTERVAL_MS)
  }

  const stopTracking = () => {
    if (!tracking) return
    setTracking(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    void sendTrackingEvent('stop')
  }

  const lastSentLabel = lastSentAt
    ? new Date(lastSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Not sent yet'

  const permissionLabel = permission === 'unknown' ? 'Checking…' : permission

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-2xl">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Share location</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">Welcome, {staffName}.</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              tracking ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
            }`}>
              {tracking ? 'Sharing on' : 'Sharing off'}
            </div>
          </div>

          <Surface padding="md" className="space-y-4">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                Opt in to share your live location for delivery routing. Updates send every few minutes while this page is open.
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Location history is retained for about {RETENTION_HOURS} hours and only visible to dispatch.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={startTracking}
                variant="primary"
                size="sm"
                disabled={tracking || permission === 'denied' || isSending}
              >
                Start sharing
              </Button>
              <Button
                onClick={stopTracking}
                variant="ghost"
                size="sm"
                disabled={!tracking}
              >
                Stop
              </Button>
            </div>

            <div className="grid gap-2 text-xs text-[var(--text-muted)]">
              <div>Permission: {permissionLabel}</div>
              <div>Last update: {lastSentLabel}</div>
              {lastAccuracy !== null && (
                <div>Accuracy: ±{Math.round(lastAccuracy)}m</div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
                <p className="text-sm text-[var(--error)]">{error}</p>
              </div>
            )}
          </Surface>

          <Surface padding="md" variant="outline" className="mt-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Troubleshooting</h2>
            <ul className="text-xs text-[var(--text-muted)] mt-2 space-y-1">
              <li>• Keep this page open while delivering.</li>
              <li>• If permission is denied, enable location access in your browser settings.</li>
              <li>• Switching to Wi-Fi or LTE can improve accuracy and stability.</li>
            </ul>
          </Surface>
        </div>
      </main>

      <Footer />
    </div>
  )
}
