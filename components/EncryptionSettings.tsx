'use client'

import { useMemo, useState } from 'react'
import type { StoredKeyPair } from '@/lib/crypto/e2e'

interface EncryptionSettingsProps {
  isOpen: boolean
  onClose: () => void
  keyPairs: StoredKeyPair[]
  isLocked: boolean
  onLock: (password: string) => Promise<void>
  onUnlock: (password: string) => Promise<void>
  onRotate: () => Promise<void>
  onResetSessions: () => Promise<void>
  onUpdateDeviceLabel: (label: string) => Promise<void>
  lastBackupAt?: string | null
}

function formatDate(value?: number) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default function EncryptionSettings({
  isOpen,
  onClose,
  keyPairs,
  isLocked,
  onLock,
  onUnlock,
  onRotate,
  onResetSessions,
  onUpdateDeviceLabel,
  lastBackupAt,
}: EncryptionSettingsProps) {
  const [labelInput, setLabelInput] = useState('')
  const [lockPassword, setLockPassword] = useState('')
  const [unlockPassword, setUnlockPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const activeKey = useMemo(
    () => keyPairs.find((key) => key.isActive) || null,
    [keyPairs]
  )

  if (!isOpen) return null

  const handleLock = async () => {
    if (!lockPassword || lockPassword.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onLock(lockPassword)
      setLockPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock keys')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async () => {
    if (!unlockPassword) {
      setError('Enter your passphrase to unlock keys.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onUnlock(unlockPassword)
      setUnlockPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock keys')
    } finally {
      setLoading(false)
    }
  }

  const handleRotate = async () => {
    setLoading(true)
    setError(null)
    try {
      await onRotate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate keys')
    } finally {
      setLoading(false)
    }
  }

  const handleResetSessions = async () => {
    setLoading(true)
    setError(null)
    try {
      await onResetSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset sessions')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateLabel = async () => {
    const label = labelInput.trim()
    if (!label) return
    setLoading(true)
    setError(null)
    try {
      await onUpdateDeviceLabel(label)
      setLabelInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update label')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-[var(--border-primary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Encryption settings
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Active device</p>
              <p className="text-base text-[var(--text-primary)] font-medium mt-1">
                {activeKey?.deviceLabel || 'This device'}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Created {formatDate(activeKey?.createdAt)}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Last used {formatDate(activeKey?.lastUsedAt)}
              </p>
              {lastBackupAt && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Last backup {new Date(lastBackupAt).toLocaleString()}
                </p>
              )}
            </div>

            <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Device label</p>
              <div className="flex gap-2 mt-2">
                <input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  placeholder={activeKey?.deviceLabel || 'This device'}
                  className="flex-1"
                />
                <button
                  onClick={handleUpdateLabel}
                  disabled={loading || !labelInput.trim()}
                  className="btn-secondary text-sm"
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Label helps you track which device holds the active key.
              </p>
            </div>
          </div>

          <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">Key security</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Locking keys requires a passphrase each time you reopen the device.
            </p>

            {isLocked ? (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  placeholder="Passphrase"
                  className="flex-1 min-w-[180px]"
                />
                <button
                  onClick={handleUnlock}
                  disabled={loading}
                  className="btn-primary text-sm"
                >
                  Unlock keys
                </button>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <input
                  type="password"
                  value={lockPassword}
                  onChange={(e) => setLockPassword(e.target.value)}
                  placeholder="New passphrase"
                  className="flex-1 min-w-[180px]"
                />
                <button
                  onClick={handleLock}
                  disabled={loading}
                  className="btn-secondary text-sm"
                >
                  Lock keys
                </button>
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">Session & rotation</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Rotate if you suspect compromise. Reset sessions to force new keys for conversations.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <button
                onClick={handleRotate}
                disabled={loading}
                className="btn-primary text-sm"
              >
                Rotate keys
              </button>
              <button
                onClick={handleResetSessions}
                disabled={loading}
                className="btn-secondary text-sm"
              >
                Reset sessions
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Known keys</p>
            <div className="space-y-2">
              {keyPairs.map((key) => (
                <div
                  key={key.id}
                  className="border border-[var(--border-primary)] rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div>
                    <p className="text-sm text-[var(--text-primary)] font-medium">
                      {key.deviceLabel || 'Unknown device'}
                      {key.isActive ? ' (active)' : ''}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Created {formatDate(key.createdAt)} · Last used {formatDate(key.lastUsedAt)}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {key.privateKey ? 'Unlocked' : key.encryptedPrivateKey ? 'Locked' : 'Unavailable'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
