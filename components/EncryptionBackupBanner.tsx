'use client'

import { useState } from 'react'
import { useEncryption } from './EncryptionProvider'
import KeyBackup from './KeyBackup'

export default function EncryptionBackupBanner() {
  const { needsBackup, dismissBackupReminder, backupKeys, restoreKeys } = useEncryption()
  const [showBackupModal, setShowBackupModal] = useState(false)

  if (!needsBackup) return null

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-40 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--warning)]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V9a4 4 0 00-8 0v2m-2 0h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Secure your messages
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Back up your encryption keys to read messages on other devices. Without a backup, you won&apos;t be able to decrypt old messages if you switch browsers.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowBackupModal(true)}
                  className="px-3 py-1.5 text-xs font-medium bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Back up now
                </button>
                <button
                  onClick={dismissBackupReminder}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={dismissBackupReminder}
              className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showBackupModal && (
        <KeyBackup
          onBackup={backupKeys}
          onRestore={restoreKeys}
          onClose={() => setShowBackupModal(false)}
        />
      )}
    </>
  )
}
