'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Conversation {
  customer_id: string
  customer_email: string
  customer_name: string | null
  last_message: string
  last_message_at: string
  unread_count: number
}

interface Message {
  id: string
  content: string
  sender_type: 'customer' | 'admin'
  created_at: string
  read: boolean
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      loadMessages(selectedCustomer)
    }
  }, [selectedCustomer])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    // Get all unique customer conversations with their latest message
    const { data: messagesData } = await supabase
      .from('messages')
      .select('customer_id, content, created_at, read, sender_type')
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

    // Get customer info
    const customerIds = Array.from(customerMap.keys())
    const { data: users } = await supabase.auth.admin.listUsers()
    
    const convos: Conversation[] = []
    customerMap.forEach((data, customerId) => {
      const user = users?.users?.find(u => u.id === customerId)
      const lastMsg = data.messages[0]
      convos.push({
        customer_id: customerId,
        customer_email: user?.email || 'Unknown',
        customer_name: user?.user_metadata?.full_name || null,
        last_message: lastMsg.content,
        last_message_at: lastMsg.created_at,
        unread_count: data.unread
      })
    })

    // Sort by last message
    convos.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
    
    setConversations(convos)
    setLoading(false)
  }

  const loadMessages = async (customerId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true })

    setMessages(data || [])

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
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedCustomer) return

    setSending(true)

    const { data, error } = await supabase
      .from('messages')
      .insert({
        customer_id: selectedCustomer,
        content: newMessage.trim(),
        sender_type: 'admin',
        read: false
      })
      .select()
      .single()

    if (!error && data) {
      setMessages(prev => [...prev, data])
      setNewMessage('')
      
      // Update conversation
      setConversations(prev => prev.map(c => 
        c.customer_id === selectedCustomer 
          ? { ...c, last_message: data.content, last_message_at: data.created_at }
          : c
      ))
    }

    setSending(false)
  }

  const selectedConvo = conversations.find(c => c.customer_id === selectedCustomer)

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-8">Messages</h1>

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
                        <p className="font-medium text-[var(--text-primary)] truncate">
                          {convo.customer_name || convo.customer_email}
                        </p>
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
                <div className="p-4 border-b border-[var(--border-primary)]">
                  <p className="font-medium text-[var(--text-primary)]">
                    {selectedConvo?.customer_name || selectedConvo?.customer_email}
                  </p>
                  {selectedConvo?.customer_name && (
                    <p className="text-sm text-[var(--text-muted)]">{selectedConvo.customer_email}</p>
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
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.sender_type === 'admin' ? 'text-white/60' : 'text-[var(--text-muted)]'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
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
                      placeholder="Type a reply..."
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
    </div>
  )
}
