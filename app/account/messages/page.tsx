'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Message {
  id: string
  customer_id: string
  content: string
  sender_type: 'customer' | 'admin'
  created_at: string
  read: boolean
}

export default function MessagesPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

      setMessages(data || [])
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

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const newMsg = payload.new as Message
        if (newMsg.customer_id === userId) {
          setMessages(prev => [...prev, newMsg])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !userId) return

    setSending(true)

    const { data, error } = await supabase
      .from('messages')
      .insert({
        customer_id: userId,
        content: newMessage.trim(),
        sender_type: 'customer',
        read: false
      })
      .select()
      .single()

    if (!error && data) {
      setMessages(prev => [...prev, data])
      setNewMessage('')
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
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-4">Messages</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">Chat with 709exclusive support</p>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 300px)', minHeight: '400px' }}>
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
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${
                        msg.sender_type === 'customer' ? 'text-white/60' : 'text-[var(--text-muted)]'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
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
                  placeholder="Type a message..."
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
        </div>
      </main>

      <Footer />
    </div>
  )
}
