import { headers } from 'next/headers'

async function getMaintenance() {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host')
  const proto = h.get('x-forwarded-proto') || 'https'

  const origin = host ? `${proto}://${host}` : null
  if (!origin) return { message: null as string | null }

  const res = await fetch(`${origin}/api/maintenance`, { cache: 'no-store' }).catch(() => null)
  if (!res || !res.ok) return { message: null as string | null }

  const data = (await res.json().catch(() => null)) as { message?: string | null } | null
  return { message: data?.message ?? null }
}

export default async function MaintenancePage() {
  const { message } = await getMaintenance()

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-6">
      <div className="w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Down for maintenance</h1>
            <p className="text-sm text-[var(--text-muted)]">We’ll be back shortly.</p>
          </div>
        </div>

        {message && (
          <div className="mt-6 p-4 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{message}</p>
          </div>
        )}

        <div className="mt-6 text-sm text-[var(--text-muted)]">
          If you need help right now, message us on Instagram or email support.
        </div>
      </div>
    </div>
  )
}
