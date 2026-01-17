'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useE2EEncryption } from '@/hooks/useE2EEncryption'
import KeyVerification from '@/components/KeyVerification'
import KeyBackup from '@/components/KeyBackup'
import EncryptionSettings from '@/components/EncryptionSettings'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PWAInstallButton from '@/components/account/PWAInstallButton'
import Button from '@/components/ui/Button'
import Surface from '@/components/ui/Surface'
import { generateFileKey, encryptFileWithKey, decryptFileWithKey } from '@/lib/crypto/e2e'

interface Message {
  id: string
  customer_id: string
  content: string
  sender_type: 'customer' | 'admin'
  created_at: string
  read: boolean
  encrypted?: boolean
  iv?: string
  sender_public_key?: string
  message_index?: number
  deleted_at?: string | null
  deleted_for_both?: boolean
  expires_at?: string | null
  attachment_path?: string | null
  attachment_name?: string | null
  attachment_type?: string | null
  attachment_size?: number | null
  attachment_key?: string | null
  attachment_key_iv?: string | null
  attachment_key_sender_public_key?: string | null
  attachment_key_message_index?: number | null
}

interface DecryptedMessage extends Message {
  decryptedContent: string
}

export default function MessagesPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<DecryptedMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [retentionEnabled, setRetentionEnabled] = useState(false)
  const [retentionDays, setRetentionDays] = useState(90)
  const [showRetentionSettings, setShowRetentionSettings] = useState(false)
  const [canMessage, setCanMessage] = useState(false)
  const [eligibilityLoaded, setEligibilityLoaded] = useState(false)
  const [showKeyVerification, setShowKeyVerification] = useState(false)
  const [showKeyBackup, setShowKeyBackup] = useState(false)
  const [showEncryptionSettings, setShowEncryptionSettings] = useState(false)
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null)
  const [adminFingerprint, setAdminFingerprint] = useState<string | null>(null)
  const [adminShortFingerprint, setAdminShortFingerprint] = useState<string | null>(null)
  const [adminVerified, setAdminVerified] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [encryptionHint, setEncryptionHint] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

  const eligibleOrderStatuses = ['pending', 'paid', 'fulfilled', 'shipped']

  const {
    isInitialized,
    fingerprint,
    shortFingerprint,
    publicKey,
    encrypt,
    decrypt,
    decryptMessages,
    getRecipientPublicKey,
    backupKeys,
    restoreKeys,
    verifyUserKey,
    keyPairs,
    isLocked,
    lockKeys,
    unlockKeys,
    rotateKeys,
    resetSessions,
    updateDeviceLabel,
    error: encryptionError,
  } = useE2EEncryption(userId)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLastBackupAt(localStorage.getItem('709e2e:lastBackupAt'))
    }
  }, [])

  useEffect(() => {
    if (!showKeyBackup && typeof window !== 'undefined') {
      setLastBackupAt(localStorage.getItem('709e2e:lastBackupAt'))
    }
  }, [showKeyBackup])

  // Find an admin to message (for E2EE purposes)
  useEffect(() => {
    const findAdmin = async () => {
      const { data } = await supabase
        .from('709_profiles')
        .select('id, public_key')
        .in('role', ['admin', 'owner'])
        .limit(1)
        .single()
      
      if (data) {
        setAdminId(data.id)
      }
    }
    findAdmin()
  }, [])

  // Get admin fingerprint for verification
  useEffect(() => {
    if (adminId && isInitialized) {
      verifyUserKey(adminId).then(keyInfo => {
        if (keyInfo) {
          setAdminFingerprint(keyInfo.fingerprint)
          setAdminShortFingerprint(keyInfo.shortFingerprint)
        }
      })
    }
  }, [adminId, isInitialized, verifyUserKey])

  useEffect(() => {
    if (adminId && typeof window !== 'undefined') {
      setAdminVerified(localStorage.getItem(`709e2e:verified:${adminId}`) === 'true')
    }
  }, [adminId])

  const loadAndDecryptMessages = useCallback(async (rawMessages: Message[]) => {
    if (!isInitialized || !userId) {
      return rawMessages.map(msg => ({
        ...msg,
        decryptedContent: msg.deleted_at
          ? '[Message deleted]'
          : msg.encrypted
            ? '🔐 Encrypted message'
            : msg.content
      }))
    }

    const deletedMessages = rawMessages
      .filter(msg => msg.deleted_at)
      .map(msg => ({ ...msg, decryptedContent: '[Message deleted]' }))

    const activeMessages = rawMessages.filter(msg => !msg.deleted_at)
    const decrypted = await decryptMessages(
      activeMessages,
      (msg) => msg.sender_type === 'customer' ? userId : adminId || ''
    )

    return [...deletedMessages, ...decrypted].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [isInitialized, decryptMessages, userId, adminId])

  useEffect(() => {
    const loadMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/account/login')
        return
      }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('709_profiles')
        .select('message_retention_enabled, message_retention_days')
        .eq('id', user.id)
        .single()

      const enabled = Boolean(profile?.message_retention_enabled)
      const days = profile?.message_retention_days || 90
      setRetentionEnabled(enabled)
      setRetentionDays(days)

      if (enabled && days) {
        await fetch('/api/messages/purge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ days })
        })
      }

      const { data: orders } = await supabase
        .from('orders')
        .select('id, status')
        .eq('customer_id', user.id)

      const eligibleOrders = (orders || []).filter((order) =>
        eligibleOrderStatuses.includes(order.status)
      )
      setCanMessage(eligibleOrders.length > 0)
      setEligibilityLoaded(true)

      // Fetch messages
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: true })

      if (data) {
        const decrypted = await loadAndDecryptMessages(data)
        setMessages(decrypted as DecryptedMessage[])
      }
      
      setLoading(false)

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('customer_id', user.id)
        .eq('sender_type', 'admin')
        .eq('read', false)
    }

    loadMessages()
  }, [router, loadAndDecryptMessages])

  // Re-decrypt when encryption is initialized
  useEffect(() => {
    if (isInitialized && messages.some(m => m.encrypted && m.decryptedContent === '🔐 Encrypted message')) {
      const redecrypt = async () => {
        const decrypted = await loadAndDecryptMessages(messages)
        setMessages(decrypted as DecryptedMessage[])
      }
      redecrypt()
    }
  }, [isInitialized, messages, loadAndDecryptMessages])

  // Subscribe to new messages
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, async (payload) => {
        const newMsg = payload.new as Message
        if (newMsg.customer_id === userId) {
          const [decrypted] = await loadAndDecryptMessages([newMsg])
          setMessages(prev => [...prev, decrypted as DecryptedMessage])

          if (newMsg.sender_type === 'admin' && !newMsg.read) {
            await supabase
              .from('messages')
              .update({ read: true })
              .eq('id', newMsg.id)
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, loadAndDecryptMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !userId) return
    if (!canMessage) {
      setSendError('Messaging is available after you place an order.')
      return
    }

    setSending(true)
    setAttachmentError(null)
    setSendError(null)
    setEncryptionHint(null)
    const plaintext = newMessage.trim()

    try {
      if (attachmentFile && (!adminId || !isInitialized)) {
        setAttachmentError('Attachments require encrypted chat setup.')
        setSending(false)
        return
      }

      let messageData: {
        customer_id: string
        content: string
        sender_type: 'customer'
        read: boolean
        encrypted?: boolean
        iv?: string
        sender_public_key?: string
        message_index?: number
        expires_at?: string | null
        attachment_path?: string | null
        attachment_name?: string | null
        attachment_type?: string | null
        attachment_size?: number | null
        attachment_key?: string | null
        attachment_key_iv?: string | null
        attachment_key_sender_public_key?: string | null
        attachment_key_message_index?: number | null
      } = {
        customer_id: userId,
        content: plaintext,
        sender_type: 'customer',
        read: false,
      }

      if (retentionEnabled && retentionDays) {
        messageData.expires_at = new Date(
          Date.now() + retentionDays * 24 * 60 * 60 * 1000
        ).toISOString()
      }

      // Try to encrypt if admin has E2EE set up
      if (adminId && isInitialized) {
        const recipientPublicKey = await getRecipientPublicKey(adminId)
        if (!recipientPublicKey) {
          setEncryptionHint('Support has not enabled encryption yet. Sending unencrypted.')
        } else {
          const encrypted = await encrypt(plaintext, adminId)
          if (encrypted) {
            messageData = {
              ...messageData,
              content: encrypted.content,
              encrypted: true,
              iv: encrypted.iv,
              sender_public_key: encrypted.senderPublicKey,
              message_index: encrypted.messageIndex,
            }
          }
        }
      }

      if (attachmentFile) {
        const recipientPublicKey = adminId ? await getRecipientPublicKey(adminId) : null
        if (!recipientPublicKey) {
          setAttachmentError('Attachments require encryption to be enabled by support.')
          setSending(false)
          return
        }
        const attachmentData = await uploadEncryptedAttachment(attachmentFile)
        messageData = { ...messageData, ...attachmentData }
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (!error && data) {
        setMessages(prev => [...prev, { 
          ...data, 
          decryptedContent: plaintext
        }])
        setNewMessage('')
        setAttachmentFile(null)
      } else if (error) {
        setSendError(error.message || 'Unable to send message')
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      if (attachmentFile) {
        setAttachmentError('Failed to send attachment.')
      }
      setSendError('Unable to send message')
    }

    setSending(false)
  }

  const handleDeleteMessage = async (messageId: string) => {
    const response = await fetch('/api/messages/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId })
    })

    if (response.ok) {
      const now = new Date().toISOString()
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, deleted_at: now, decryptedContent: '[Message deleted]' }
          : msg
      ))
    }
  }

  const markAdminVerified = () => {
    if (!adminId || typeof window === 'undefined') return
    localStorage.setItem(`709e2e:verified:${adminId}`, 'true')
    setAdminVerified(true)
  }

  const resetAdminVerified = () => {
    if (!adminId || typeof window === 'undefined') return
    localStorage.removeItem(`709e2e:verified:${adminId}`)
    setAdminVerified(false)
  }

  const sanitizeFilename = (name: string) =>
    name.replace(/[^a-zA-Z0-9.\-_]/g, '_')

  const uploadEncryptedAttachment = async (file: File) => {
    if (!userId || !adminId) {
      throw new Error('Missing recipient')
    }

    const fileKey = await generateFileKey()
    const fileBuffer = await file.arrayBuffer()
    const encrypted = await encryptFileWithKey(fileBuffer, fileKey)
    const keyPayload = JSON.stringify({ key: fileKey, iv: encrypted.iv })

    const encryptedKey = await encrypt(keyPayload, adminId)
    if (!encryptedKey) {
      throw new Error('Unable to encrypt attachment key')
    }

    const blob = new Blob([encrypted.ciphertext], { type: 'application/octet-stream' })
    const formData = new FormData()
    formData.append('file', blob, `encrypted-${sanitizeFilename(file.name)}`)
    formData.append('filename', file.name)

    const response = await fetch('/api/messages/attachment-upload', {
      method: 'POST',
      body: formData,
    })

    const uploadPayload = await response.json()
    if (!response.ok) {
      throw new Error(uploadPayload?.error || 'Failed to upload attachment')
    }

    const path = uploadPayload.path as string

    return {
      attachment_path: path,
      attachment_name: file.name,
      attachment_type: file.type,
      attachment_size: file.size,
      attachment_key: encryptedKey.content,
      attachment_key_iv: encryptedKey.iv,
      attachment_key_sender_public_key: encryptedKey.senderPublicKey,
      attachment_key_message_index: encryptedKey.messageIndex,
    }
  }

  const handleDownloadAttachment = async (msg: DecryptedMessage) => {
    if (!msg.attachment_path || !msg.attachment_key || !msg.attachment_key_iv || !msg.attachment_key_sender_public_key) {
      return
    }
    if (!userId || !adminId) return
    try {
      const keyPayload = await decrypt(
        {
          id: msg.id,
          content: msg.attachment_key,
          iv: msg.attachment_key_iv,
          sender_public_key: msg.attachment_key_sender_public_key,
          message_index: msg.attachment_key_message_index || 0,
          encrypted: true,
          sender_type: msg.sender_type,
          customer_id: msg.customer_id,
        },
        msg.sender_type === 'customer' ? userId : adminId
      )

      const { key, iv } = JSON.parse(keyPayload) as { key: string; iv: string }

      const urlResponse = await fetch('/api/messages/attachment-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msg.id })
      })

      if (!urlResponse.ok) return
      const { signedUrl } = await urlResponse.json()
      const fileResponse = await fetch(signedUrl)
      const encryptedBuffer = await fileResponse.arrayBuffer()
      const decryptedBuffer = await decryptFileWithKey(encryptedBuffer, key, iv)

      const blob = new Blob([decryptedBuffer], { type: msg.attachment_type || 'application/octet-stream' })
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = msg.attachment_name || 'attachment'
      link.click()
      URL.revokeObjectURL(downloadUrl)
    } catch {
      setAttachmentError('Unable to decrypt attachment.')
    }
  }

  const updateRetention = async (enabled: boolean, days: number) => {
    const response = await fetch('/api/messages/retention', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, days })
    })

    if (response.ok) {
      setRetentionEnabled(enabled)
      setRetentionDays(days)
      if (enabled) {
        await fetch('/api/messages/purge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ days })
        })
      }
    }
  }

  const purgeOldMessages = async () => {
    if (!retentionEnabled) return
    await fetch('/api/messages/purge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: retentionDays })
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="container max-w-2xl h-full">
          <div className="mb-6">
            <Link href="/account" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              ← Back to Account
            </Link>
            <div className="flex items-center justify-between mt-4">
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Messages</h1>
                <p className="text-[var(--text-muted)] text-sm mt-1">Support chat</p>
              </div>
              {/* E2EE Status & Actions */}
              <div className="flex items-center gap-2">
                <PWAInstallButton label="Install support app" />
                {isInitialized ? (
                  <span className="flex items-center gap-1 px-2 py-1 bg-[var(--success)]/10 text-[var(--success)] text-xs rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Encrypted
                  </span>
                ) : encryptionError ? (
                  <span className="flex items-center gap-1 px-2 py-1 bg-[var(--warning)]/10 text-[var(--warning)] text-xs rounded-full">
                    Encryption unavailable
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-xs rounded-full">
                    Setting up...
                  </span>
                )}
              </div>
            </div>
            {encryptionHint && (
              <p className="mt-3 text-xs text-[var(--warning)]">{encryptionHint}</p>
            )}
          </div>

          {/* E2EE Action Buttons */}
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setShowKeyVerification(true)}
              variant="ghost"
              size="sm"
            >
              Verify keys
            </Button>
            <Button
              onClick={() => setShowKeyBackup(true)}
              variant="ghost"
              size="sm"
            >
              Backup
            </Button>
            <Button
              onClick={() => setShowEncryptionSettings(true)}
              variant="ghost"
              size="sm"
            >
              Security
            </Button>
          </div>
          {adminVerified && (
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-[var(--success)]/20 text-[var(--success)]">
                Verified contact
              </span>
            </div>
          )}

          <Surface padding="md" className="mb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Message retention</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {retentionEnabled
                    ? `Messages expire after ${retentionDays} days.`
                    : 'Retention is off. Messages are kept until deleted.'}
                </p>
              </div>
              <div className="flex gap-2">
                {retentionEnabled && (
                  <Button variant="ghost" size="sm" onClick={purgeOldMessages}>
                    Purge now
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowRetentionSettings(v => !v)}>
                  {showRetentionSettings ? 'Close' : 'Configure'}
                </Button>
              </div>
            </div>

            {showRetentionSettings && (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={retentionEnabled}
                    onChange={(e) => updateRetention(e.target.checked, retentionDays)}
                  />
                  <span>Enable retention</span>
                </label>
                <select
                  value={retentionDays}
                  onChange={(e) => updateRetention(retentionEnabled, parseInt(e.target.value, 10))}
                  disabled={!retentionEnabled}
                  className="min-w-[120px]"
                >
                  {[30, 90, 180].map((days) => (
                    <option key={days} value={days}>{days} days</option>
                  ))}
                </select>
              </div>
            )}
          </Surface>

          {!canMessage && eligibilityLoaded && (
            <Surface padding="md" className="mb-4 border border-[var(--warning)]/30 bg-[var(--warning)]/10">
              <p className="text-sm text-[var(--text-primary)] font-medium">Window shopper mode</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Messaging unlocks after your first order. Pending orders can message support about the product.
              </p>
              <Link
                href="/shop"
                className="inline-flex mt-3 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                Browse products →
              </Link>
            </Surface>
          )}

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 380px)', minHeight: '400px' }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center py-12">
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                      <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-[var(--text-muted)]">No messages yet</p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Start a conversation with us!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`group relative max-w-[80%] px-4 py-3 rounded-2xl ${
                        msg.sender_type === 'customer'
                          ? 'bg-[var(--accent)] text-white rounded-br-md'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm">{msg.decryptedContent || msg.content}</p>
                      {msg.attachment_path && !msg.deleted_at && (
                        <button
                          onClick={() => handleDownloadAttachment(msg)}
                          className={`mt-2 text-xs underline ${
                            msg.sender_type === 'customer'
                              ? 'text-white/80 hover:text-white'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          📎 {msg.attachment_name || 'Attachment'}
                        </button>
                      )}
                      <div className={`flex items-center gap-1 text-[10px] mt-1 ${
                        msg.sender_type === 'customer' ? 'text-white/60' : 'text-[var(--text-muted)]'
                      }`}>
                        {msg.encrypted && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {!msg.deleted_at && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="absolute -top-2 -right-2 bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-primary)] rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete message"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-[var(--border-primary)]">
              <input
                ref={attachmentInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  setAttachmentFile(file || null)
                  setAttachmentError(null)
                }}
              />

              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isInitialized && adminId ? "Type an encrypted message..." : "Type a message..."}
                    className="flex-1 resize-none w-full"
                    rows={2}
                    disabled={sending || !canMessage}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        ;(e.currentTarget.form as HTMLFormElement | null)?.requestSubmit()
                      }
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      className={`text-[var(--text-secondary)] hover:text-[var(--text-primary)] ${
                        !canMessage ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={!canMessage}
                    >
                      Attach file
                    </button>
                    {attachmentFile && (
                      <div className="flex items-center gap-2">
                        <span>{attachmentFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachmentFile(null)}
                          className="text-[var(--text-muted)] hover:text-[var(--error)]"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  {(attachmentError || sendError) && (
                    <p className="text-xs text-[var(--error)]">{attachmentError || sendError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending || !canMessage}
                  className="btn-primary px-6"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* E2EE Info */}
          <Surface padding="md" className="mt-4">
            <p className="text-xs text-[var(--text-muted)]">
              <span className="text-[var(--text-secondary)] font-medium">End-to-end encrypted:</span> Messages are encrypted on your device before sending. Only you and support can read them.
            </p>
          </Surface>
        </div>
      </main>

      <Footer />

      {/* Key Verification Modal */}
      {showKeyVerification && (
        <KeyVerification
          myFingerprint={fingerprint}
          myShortFingerprint={shortFingerprint}
          myPublicKey={publicKey}
          theirFingerprint={adminFingerprint}
          theirShortFingerprint={adminShortFingerprint}
          theirName="709exclusive Support"
          isVerified={adminVerified}
          onVerify={markAdminVerified}
          onResetVerification={resetAdminVerified}
          isInitialized={isInitialized}
          error={encryptionError}
          onClose={() => setShowKeyVerification(false)}
        />
      )}

      {/* Key Backup Modal */}
      {showKeyBackup && (
        <KeyBackup
          onBackup={backupKeys}
          onRestore={restoreKeys}
          lastBackupAt={lastBackupAt}
          onClose={() => setShowKeyBackup(false)}
        />
      )}

      {showEncryptionSettings && (
        <EncryptionSettings
          isOpen={showEncryptionSettings}
          onClose={() => setShowEncryptionSettings(false)}
          keyPairs={keyPairs}
          isLocked={isLocked}
          onLock={lockKeys}
          onUnlock={unlockKeys}
          onRotate={rotateKeys}
          onResetSessions={resetSessions}
          onUpdateDeviceLabel={updateDeviceLabel}
          lastBackupAt={lastBackupAt}
        />
      )}
    </div>
  )
}
