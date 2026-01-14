'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useE2EEncryption } from '@/hooks/useE2EEncryption'
import KeyVerification from '@/components/KeyVerification'
import KeyBackup from '@/components/KeyBackup'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

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
  const [showKeyVerification, setShowKeyVerification] = useState(false)
  const [showKeyBackup, setShowKeyBackup] = useState(false)
  const [adminFingerprint, setAdminFingerprint] = useState<string | null>(null)
  const [adminShortFingerprint, setAdminShortFingerprint] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    isInitialized,
    fingerprint,
    shortFingerprint,
    publicKey,
    encrypt,
    decryptMessages,
    backupKeys,
    restoreKeys,
    verifyUserKey,
    error: encryptionError,
  } = useE2EEncryption(userId)

  // Find an admin to message (for E2EE purposes)
  useEffect(() => {
    const findAdmin = async () => {
      const { data } = await supabase
        .from('709_profiles')
        .select('id, public_key')
        .in('role', ['admin', 'owner'])
        .not('public_key', 'is', null)
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

  const loadAndDecryptMessages = useCallback(async (rawMessages: Message[]) => {
    if (!isInitialized || !userId) {
      return rawMessages.map(msg => ({
        ...msg,
        decryptedContent: msg.encrypted ? '🔐 Encrypted message' : msg.content
      }))
    }

    return decryptMessages(
      rawMessages,
      (msg) => msg.sender_type === 'customer' ? userId : adminId || ''
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

    setSending(true)
    const plaintext = newMessage.trim()

    try {
      let messageData: {
        customer_id: string
        content: string
        sender_type: 'customer'
        read: boolean
        encrypted?: boolean
        iv?: string
        sender_public_key?: string
        message_index?: number
      } = {
        customer_id: userId,
        content: plaintext,
        sender_type: 'customer',
        read: false,
      }

      // Try to encrypt if admin has E2EE set up
      if (adminId && isInitialized) {
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
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    }

    setSending(false)
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
                <p className="text-[var(--text-muted)] text-sm mt-1">Chat with 709exclusive support</p>
              </div>
              {/* E2EE Status & Actions */}
              <div className="flex items-center gap-2">
                {isInitialized ? (
                  <span className="flex items-center gap-1 px-2 py-1 bg-[var(--success)]/10 text-[var(--success)] text-xs rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    E2E Encrypted
                  </span>
                ) : encryptionError ? (
                  <span className="flex items-center gap-1 px-2 py-1 bg-[var(--warning)]/10 text-[var(--warning)] text-xs rounded-full">
                    ⚠️ Encryption unavailable
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-xs rounded-full">
                    Setting up...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* E2EE Action Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowKeyVerification(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              🔑 Verify Keys
            </button>
            <button
              onClick={() => setShowKeyBackup(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              💾 Backup Keys
            </button>
          </div>

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
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        msg.sender_type === 'customer'
                          ? 'bg-[var(--accent)] text-white rounded-br-md'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm">{msg.decryptedContent || msg.content}</p>
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
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-[var(--border-primary)]">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isInitialized && adminId ? "Type an encrypted message..." : "Type a message..."}
                  className="flex-1"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
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
          <div className="mt-4 p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
            <p className="text-xs text-[var(--text-muted)]">
              <strong className="text-[var(--text-secondary)]">🔐 End-to-End Encrypted:</strong> Your messages are encrypted on your device before being sent. Only you and our support team can read them.
            </p>
          </div>
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
          onClose={() => setShowKeyBackup(false)}
        />
      )}
    </div>
  )
}
