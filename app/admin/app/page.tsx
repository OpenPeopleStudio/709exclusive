import Link from 'next/link'

export default function AdminAppInstallPage() {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Install Admin App</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Add the admin console to your home screen for a fast, app-like experience.
          </p>
        </div>
        <Link href="/admin/messages" className="btn-secondary text-sm">
          Open messages
        </Link>
      </div>

      <div className="grid gap-4">
        <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Android (Chrome)</h2>
          <ol className="text-sm text-[var(--text-secondary)] space-y-1 list-decimal list-inside">
            <li>Open the admin console in Chrome.</li>
            <li>Tap the menu (⋮) or the install banner.</li>
            <li>Select “Install app”.</li>
          </ol>
        </div>

        <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">iPhone / iPad (Safari)</h2>
          <ol className="text-sm text-[var(--text-secondary)] space-y-1 list-decimal list-inside">
            <li>Open the admin console in Safari.</li>
            <li>Tap Share.</li>
            <li>Select “Add to Home Screen”.</li>
          </ol>
        </div>

        <div className="p-6 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Tip</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            The installed app opens directly to messages by default and keeps you signed in longer.
          </p>
        </div>
      </div>
    </div>
  )
}

