'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useE2EEncryption } from '@/hooks/useE2EEncryption'
import KeyVerification from '@/components/KeyVerification'
import KeyBackup from '@/components/KeyBackup'

interface Conversation {
  customer_id: string
  customer_email: string
  customer_name: string | null
  last_message: string
  last_message_at: string
  unread_count: number
  has_encryption: boolean
}

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

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [messages, setMessages] = useState<DecryptedMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [showKeyVerification, setShowKeyVerification] = useState(false)
  const [showKeyBackup, setShowKeyBackup] = useState(false)
  const [verifyCustomer, setVerifyCustomer] = useState<{
    id: string
    name: string
    fingerprint: string
    shortFingerprint: string
  } | null>(null)
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
  } = useE2EEncryption(adminId)

  // Get admin user ID
  useEffect(() => {
    const getAdminId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setAdminId(user.id)
      }
    }
    getAdminId()
  }, [])

  const loadConversations = useCallback(async () => {
    // Get all unique customer conversations with their latest message
    const { data: messagesData } = await supabase
      .from('messages')
      .select('customer_id, content, created_at, read, sender_type, encrypted')
      .order('created_at', { ascending: false })

    if (!messagesData) {
      setLoading(false)
      return
    }

    // Group by customer
    const customerMap = new Map<string, {
      messages: typeof messagesData,
      unread: number
    }>()

    messagesData.forEach(msg => {
      if (!customerMap.has(msg.customer_id)) {
        customerMap.set(msg.customer_id, { messages: [], unread: 0 })
      }
      const entry = customerMap.get(msg.customer_id)!
      entry.messages.push(msg)
      if (!msg.read && msg.sender_type === 'customer') {
        entry.unread++
      }
    })

    // Get customer info via API (auth.admin.listUsers requires server-side)
    const customerIds = Array.from(customerMap.keys())
    let users: { id: string; email: string; full_name: string | null }[] = []
    try {
      const response = await fetch('/api/admin/messages/users')
      if (response.ok) {
        const data = await response.json()
        users = data.users || []
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }

    // Get encryption status from profiles
    const { data: profiles } = await supabase
      .from('709_profiles')
      .select('id, public_key')
      .in('id', customerIds)
    
    const convos: Conversation[] = []
    customerMap.forEach((data, customerId) => {
      const user = users.find(u => u.id === customerId)
      const profile = profiles?.find(p => p.id === customerId)
      const lastMsg = data.messages[0]
      convos.push({
        customer_id: customerId,
        customer_email: user?.email || 'Unknown',
        customer_name: user?.full_name || null,
        last_message: lastMsg.encrypted ? '🔐 Encrypted message' : lastMsg.content,
        last_message_at: lastMsg.created_at,
        unread_count: data.unread,
        has_encryption: !!profile?.public_key,
      })
    })

    // Sort by last message
    convos.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
    
    setConversations(convos)
    setLoading(false)
  }, [])

  const loadMessages = useCallback(async (customerId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true })

    if (!data) {
      setMessages([])
      return
    }

    // Decrypt messages
    if (isInitialized) {
      const decrypted = await decryptMessages(
        data,
        (msg) => msg.sender_type === 'customer' ? msg.customer_id : adminId!
      )
      setMessages(decrypted as DecryptedMessage[])
    } else {
      // Not initialized yet, show encrypted indicator
      setMessages(data.map(msg => ({
        ...msg,
        decryptedContent: msg.encrypted ? '🔐 Encrypted message' : msg.content
      })))
    }

    // Mark as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('customer_id', customerId)
      .eq('sender_type', 'customer')
      .eq('read', false)

    // Update conversation unread count
    setConversations(prev => prev.map(c => 
      c.customer_id === customerId ? { ...c, unread_count: 0 } : c
    ))
  }, [isInitialized, decryptMessages, adminId])

  // Re-decrypt when encryption is initialized
  useEffect(() => {
    if (isInitialized && selectedCustomer && messages.some(m => m.encrypted && m.decryptedContent === '🔐 Encrypted message')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadMessages(selectedCustomer)
    }
  }, [isInitialized, selectedCustomer, messages, loadMessages])

  useEffect(() => {
    // Initial data fetch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (selectedCustomer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadMessages(selectedCustomer)
    }
  }, [selectedCustomer, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedCustomer) return

    setSending(true)
    const plaintext = newMessage.trim()

    try {
      // Try to encrypt the message
      let messageData: {
        customer_id: string
        content: string
        sender_type: 'admin'
        read: boolean
        encrypted?: boolean
        iv?: string
        sender_public_key?: string
        message_index?: number
      } = {
        customer_id: selectedCustomer,
        content: plaintext,
        sender_type: 'admin',
        read: false,
      }

      // Attempt encryption if E2EE is initialized
      if (isInitialized) {
        const encrypted = await encrypt(plaintext, selectedCustomer)
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
        // Add to local state with decrypted content
        setMessages(prev => [...prev, { 
          ...data, 
          decryptedContent: plaintext 
        }])
        setNewMessage('')
        
        // Update conversation
        setConversations(prev => prev.map(c => 
          c.customer_id === selectedCustomer 
            ? { ...c, last_message: data.encrypted ? '🔐 Encrypted message' : plaintext, last_message_at: data.created_at }
            : c
        ))
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    }

    setSending(false)
  }

  const handleVerifyCustomer = async (customerId: string, customerName: string) => {
    const keyInfo = await verifyUserKey(customerId)
    if (keyInfo) {
      setVerifyCustomer({
        id: customerId,
        name: customerName,
        fingerprint: keyInfo.fingerprint,
        shortFingerprint: keyInfo.shortFingerprint,
      })
      setShowKeyVerification(true)
    }
  }

  const selectedConvo = conversations.find(c => c.customer_id === selectedCustomer)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Messages</h1>
        
        {/* E2EE Status & Actions */}
        <div className="flex items-center gap-3">
          {isInitialized ? (
            <span className="flex items-center gap-2 px-3 py-1.5 bg-[var(--success)]/10 text-[var(--success)] text-sm rounded-full">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              E2E Encrypted
            </span>
          ) : (
            <span className="text-sm text-[var(--text-muted)]">
              Setting up encryption...
            </span>
          )}
          
          <button
            onClick={() => setShowKeyVerification(true)}
            className="btn-secondary text-sm"
          >
            🔑 Verify Keys
          </button>
          
          <button
            onClick={() => setShowKeyBackup(true)}
            className="btn-secondary text-sm"
          >
            💾 Backup
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-80 border-r border-[var(--border-primary)] flex flex-col">
            <div className="p-4 border-b border-[var(--border-primary)]">
              <h2 className="font-semibold text-[var(--text-primary)]">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-[var(--text-muted)]">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-[var(--text-muted)]">No messages yet</div>
              ) : (
                conversations.map(convo => (
                  <button
                    key={convo.customer_id}
                    onClick={() => setSelectedCustomer(convo.customer_id)}
                    className={`w-full p-4 text-left border-b border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] transition-colors ${
                      selectedCustomer === convo.customer_id ? 'bg-[var(--bg-tertiary)]' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[var(--text-primary)] truncate">
                            {convo.customer_name || convo.customer_email}
                          </p>
                          {convo.has_encryption && (
                            <svg className="w-3.5 h-3.5 text-[var(--success)] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-[var(--text-muted)] truncate mt-1">
                          {convo.last_message}
                        </p>
                      </div>
                      {convo.unread_count > 0 && (
                        <span className="ml-2 min-w-[20px] h-5 flex items-center justify-center bg-[var(--accent)] text-white text-xs font-bold rounded-full px-1.5">
                          {convo.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      {new Date(convo.last_message_at).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedCustomer ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {selectedConvo?.customer_name || selectedConvo?.customer_email}
                    </p>
                    {selectedConvo?.customer_name && (
                      <p className="text-sm text-[var(--text-muted)]">{selectedConvo.customer_email}</p>
                    )}
                  </div>
                  {selectedConvo?.has_encryption && (
                    <button
                      onClick={() => handleVerifyCustomer(
                        selectedCustomer,
                        selectedConvo?.customer_name || selectedConvo?.customer_email || 'Customer'
                      )}
                      className="text-sm text-[var(--success)] hover:underline"
                    >
                      🔐 Verify Key
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                          msg.sender_type === 'admin'
                            ? 'bg-[var(--accent)] text-white rounded-br-md'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm">{msg.decryptedContent || msg.content}</p>
                        <div className={`flex items-center gap-1 text-[10px] mt-1 ${
                          msg.sender_type === 'admin' ? 'text-white/60' : 'text-[var(--text-muted)]'
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
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-[var(--border-primary)]">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={
                        selectedConvo?.has_encryption && isInitialized
                          ? "Type an encrypted message..."
                          : "Type a message..."
                      }
                      className="flex-1"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="btn-primary px-6"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[var(--text-muted)]">Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Verification Modal */}
      {showKeyVerification && (
        <KeyVerification
          myFingerprint={fingerprint}
          myShortFingerprint={shortFingerprint}
          myPublicKey={publicKey}
          theirFingerprint={verifyCustomer?.fingerprint}
          theirShortFingerprint={verifyCustomer?.shortFingerprint}
          theirName={verifyCustomer?.name}
          onClose={() => {
            setShowKeyVerification(false)
            setVerifyCustomer(null)
          }}
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
