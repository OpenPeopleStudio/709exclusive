'use client'

import { useEffect, useRef, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Surface from '@/components/ui/Surface'
import Button from '@/components/ui/Button'

const UPDATE_INTERVAL_MS = 45 * 1000
const RETENTION_HOURS = 48
const POSITION_TIMEOUT_MS = 12000
const MAXIMUM_AGE_MS = 60 * 1000

type LocationEvent = 'start' | 'stop'

type StaffLocationClientProps = {
  staffName: string
}

export default function StaffLocationClient({ staffName }: StaffLocationClientProps) {
  const [tracking, setTracking] = useState(false)
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
  const [isOnline, setIsOnline] = useState(true)
  const [lastSentAt, setLastSentAt] = useState<string | null>(null)
  const [lastAccuracy, setLastAccuracy] = useState<number | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSentRef = useRef<number | null>(null)
  const pendingPositionRef = useRef<GeolocationPosition | null>(null)
  const trackingRef = useRef(false)
  const isOnlineRef = useRef(true)
  const inFlightRef = useRef(false)

  useEffect(() => {
    if (typeof navigator === 'undefined') return

    if (!('geolocation' in navigator)) {
      setError('Location services are not available on this device.')
      return
    }

    setIsOnline(navigator.onLine)

    if ('permissions' in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((status) => {
          setPermission(status.state)
          status.onchange = () => setPermission(status.state)
        })
        .catch(() => {})
    }

    const handleOnline = () => {
      setIsOnline(true)
      setError(null)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setError('You are offline. Location updates are paused.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current)
      }
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    trackingRef.current = tracking
  }, [tracking])

  useEffect(() => {
    isOnlineRef.current = isOnline
    if (isOnline && trackingRef.current) {
      requestPosition()
    }
  }, [isOnline])

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

  const clearHeartbeat = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const clearWatch = () => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }

  const clearFlushTimeout = () => {
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current)
      flushTimeoutRef.current = null
    }
  }

  const sendLocation = async (position: GeolocationPosition) => {
    if (!isOnlineRef.current) {
      setError('You are offline. Location updates are paused.')
      return
    }
    if (inFlightRef.current) return
    inFlightRef.current = true
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
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Unable to update location')
      }

      setLastSentAt(new Date().toISOString())
      setLastAccuracy(Number.isFinite(accuracy) ? accuracy : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update location')
    } finally {
      setIsSending(false)
      inFlightRef.current = false
    }
  }

  const scheduleFlush = (delayMs: number) => {
    if (flushTimeoutRef.current) return
    flushTimeoutRef.current = setTimeout(() => {
      flushTimeoutRef.current = null
      if (!trackingRef.current) return
      const pending = pendingPositionRef.current
      if (!pending) return
      pendingPositionRef.current = null
      lastSentRef.current = Date.now()
      void sendLocation(pending)
    }, Math.max(0, delayMs))
  }

  const handleGeoError = (geoError: GeolocationPositionError) => {
    if (geoError.code === geoError.PERMISSION_DENIED) {
      setPermission('denied')
      setTracking(false)
      clearHeartbeat()
      clearWatch()
      clearFlushTimeout()
    }
    setError(geoError.message || 'Unable to read location')
  }

  const handlePosition = (position: GeolocationPosition) => {
    if (!trackingRef.current) return
    if (!isOnlineRef.current) {
      setError('You are offline. Location updates are paused.')
      return
    }
    const lastSent = lastSentRef.current
    if (!lastSent || Date.now() - lastSent >= UPDATE_INTERVAL_MS) {
      lastSentRef.current = Date.now()
      pendingPositionRef.current = null
      void sendLocation(position)
      return
    }

    pendingPositionRef.current = position
    scheduleFlush(UPDATE_INTERVAL_MS - (Date.now() - lastSent))
  }

  const requestPosition = () => {
    if (!('geolocation' in navigator)) {
      setError('Location services are not available on this device.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      handlePosition,
      handleGeoError,
      {
        enableHighAccuracy: false,
        timeout: POSITION_TIMEOUT_MS,
        maximumAge: MAXIMUM_AGE_MS,
      }
    )
  }

  const startWatch = () => {
    if (!('geolocation' in navigator)) return
    if (watchIdRef.current !== null) return
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleGeoError,
      {
        enableHighAccuracy: false,
        timeout: POSITION_TIMEOUT_MS,
        maximumAge: MAXIMUM_AGE_MS,
      }
    )
  }

  const startHeartbeat = () => {
    if (intervalRef.current) return
    intervalRef.current = setInterval(() => {
      if (!trackingRef.current) return
      const lastSent = lastSentRef.current
      if (!lastSent || Date.now() - lastSent >= UPDATE_INTERVAL_MS) {
        requestPosition()
      }
    }, UPDATE_INTERVAL_MS)
  }

  const startTracking = () => {
    if (tracking) return
    setTracking(true)
    setError(null)
    lastSentRef.current = null
    pendingPositionRef.current = null
    void sendTrackingEvent('start')
    startWatch()
    requestPosition()
    startHeartbeat()
  }

  const stopTracking = (options?: { silent?: boolean }) => {
    if (!tracking) return
    setTracking(false)
    clearHeartbeat()
    clearWatch()
    clearFlushTimeout()
    pendingPositionRef.current = null
    if (!options?.silent) {
      void sendTrackingEvent('stop')
    }
  }

  const lastSentLabel = lastSentAt
    ? new Date(lastSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Not sent yet'

  const permissionLabel = permission === 'unknown' ? 'Checking…' : permission
  const updateIntervalSeconds = Math.round(UPDATE_INTERVAL_MS / 1000)

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
                Opt in to share your live location for delivery routing. Updates send about every {updateIntervalSeconds} seconds while this page is open.
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                You can stop sharing at any time. Location history is retained for about {RETENTION_HOURS} hours and only visible to dispatch.
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
                onClick={() => stopTracking()}
                variant="ghost"
                size="sm"
                disabled={!tracking}
              >
                Stop
              </Button>
            </div>

            <div className="grid gap-2 text-xs text-[var(--text-muted)]">
              <div>Permission: {permissionLabel}</div>
              <div>Connection: {isOnline ? 'Online' : 'Offline'}</div>
              <div>Update cadence: ~{updateIntervalSeconds}s</div>
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
              <li>• If you go offline, updates resume once you reconnect.</li>
            </ul>
          </Surface>
        </div>
      </main>

      <Footer />
    </div>
  )
}
