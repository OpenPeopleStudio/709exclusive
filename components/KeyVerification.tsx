'use client'

import { useState, useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface KeyVerificationProps {
  myFingerprint: string | null
  myShortFingerprint: string | null
  myPublicKey: string | null
  theirFingerprint?: string | null
  theirShortFingerprint?: string | null
  theirName?: string
  isVerified?: boolean
  onVerify?: () => void
  onResetVerification?: () => void
  onClose: () => void
  isInitialized?: boolean
  error?: string | null
}

export default function KeyVerification({
  myFingerprint,
  myShortFingerprint,
  myPublicKey,
  theirFingerprint,
  theirShortFingerprint,
  theirName,
  isVerified = false,
  onVerify,
  onResetVerification,
  onClose,
  isInitialized = true,
  error = null,
}: KeyVerificationProps) {
  const [activeTab, setActiveTab] = useState<'my-key' | 'verify'>('my-key')
  const [copied, setCopied] = useState(false)

  // Check if we're still loading
  const isLoading = !isInitialized && !error && !myPublicKey

  // Generate QR data when keys are available
  const qrData = useMemo(() => {
    if (!myPublicKey || !myShortFingerprint) return ''
    return JSON.stringify({
      type: '709e2e',
      version: 1,
      publicKey: myPublicKey,
      fingerprint: myShortFingerprint,
    })
  }, [myPublicKey, myShortFingerprint])

  const copyFingerprint = async (fingerprint: string) => {
    await navigator.clipboard.writeText(fingerprint)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[var(--border-primary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            🔐 Key Verification
          </h2>
          <button 
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        {theirFingerprint && (
          <div className="flex border-b border-[var(--border-primary)]">
            <button
              onClick={() => setActiveTab('my-key')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'my-key'
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              My Key
            </button>
            <button
              onClick={() => setActiveTab('verify')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'verify'
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              Verify {theirName}
            </button>
          </div>
        )}

        <div className="p-6">
          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-sm text-[var(--error)] font-medium mb-1">Encryption Error</p>
              <p className="text-xs text-[var(--text-muted)]">{error}</p>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Try refreshing the page or check if your browser supports IndexedDB.
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !error && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-[var(--text-muted)]">Initializing encryption keys...</p>
              <p className="text-xs text-[var(--text-muted)] mt-2">This may take a few seconds</p>
            </div>
          )}

          {!isLoading && activeTab === 'my-key' ? (
            <>
              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white rounded-lg">
                  {qrData ? (
                    <QRCodeSVG 
                      value={qrData} 
                      size={180}
                      level="M"
                    />
                  ) : (
                    <div className="w-[180px] h-[180px] flex items-center justify-center text-gray-400">
                      {error ? 'Keys unavailable' : 'Generating...'}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-center text-sm text-[var(--text-muted)] mb-4">
                Share this QR code or fingerprint to verify your identity
              </p>

              {/* Short Fingerprint */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                  Short Fingerprint
                </label>
                <div className="mt-1 p-3 bg-[var(--bg-tertiary)] rounded-lg font-mono text-center">
                  <span className="text-[var(--text-primary)] tracking-wider">
                    {myShortFingerprint || 'Loading...'}
                  </span>
                </div>
              </div>

              {/* Full Fingerprint */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                  Full Fingerprint
                </label>
                <button
                  onClick={() => myFingerprint && copyFingerprint(myFingerprint)}
                  className="mt-1 w-full p-3 bg-[var(--bg-tertiary)] rounded-lg font-mono text-xs text-left hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <span className="text-[var(--text-secondary)] break-all">
                    {myFingerprint || 'Loading...'}
                  </span>
                  <span className="block mt-2 text-[var(--text-muted)] text-xs">
                    {copied ? '✓ Copied!' : 'Click to copy'}
                  </span>
                </button>
              </div>

              <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                <p className="text-xs text-[var(--text-muted)]">
                  <strong className="text-[var(--text-secondary)]">How to verify:</strong> Compare this fingerprint 
                  with what others see when they view your profile. If they match, your messages are truly end-to-end encrypted.
                </p>
              </div>
            </>
          ) : !isLoading ? (
            <>
              {/* Verify Their Key */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <h3 className="font-medium text-[var(--text-primary)]">{theirName}</h3>
              </div>

              {/* Their Short Fingerprint */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                  Their Short Fingerprint
                </label>
                <div className="mt-1 p-3 bg-[var(--bg-tertiary)] rounded-lg font-mono text-center">
                  <span className="text-[var(--text-primary)] tracking-wider">
                    {theirShortFingerprint || 'Not available'}
                  </span>
                </div>
              </div>

              {/* Their Full Fingerprint */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                  Their Full Fingerprint
                </label>
                <button
                  onClick={() => theirFingerprint && copyFingerprint(theirFingerprint)}
                  className="mt-1 w-full p-3 bg-[var(--bg-tertiary)] rounded-lg font-mono text-xs text-left hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <span className="text-[var(--text-secondary)] break-all">
                    {theirFingerprint || 'Not available'}
                  </span>
                  <span className="block mt-2 text-[var(--text-muted)] text-xs">
                    {copied ? '✓ Copied!' : 'Click to copy'}
                  </span>
                </button>
              </div>

              <div className="p-3 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg">
                <p className="text-xs text-[var(--success)]">
                  <strong>To verify:</strong> Ask {theirName} to show you their fingerprint in person or via 
                  a trusted channel (phone call, video). If it matches what you see here, your conversation is secure.
                </p>
              </div>

              {(onVerify || onResetVerification) && (
                <div className="mt-4 flex gap-2">
                  {isVerified ? (
                    <>
                      <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-[var(--success)]/20 text-[var(--success)]">
                        Verified
                      </span>
                      {onResetVerification && (
                        <button
                          onClick={onResetVerification}
                          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                        >
                          Reset
                        </button>
                      )}
                    </>
                  ) : (
                    onVerify && (
                      <button
                        onClick={onVerify}
                        className="btn-primary text-sm"
                      >
                        Mark as verified
                      </button>
                    )
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
