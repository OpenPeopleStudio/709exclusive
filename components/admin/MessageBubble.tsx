'use client'

interface MessageBubbleProps {
  content: string
  isOwn: boolean
  timestamp: string
  isEncrypted?: boolean
  senderName?: string
  showAvatar?: boolean
}

export default function MessageBubble({
  content,
  isOwn,
  timestamp,
  isEncrypted,
  senderName,
  showAvatar = true,
}: MessageBubbleProps) {
  // Safely handle invalid timestamps
  const time = timestamp && !isNaN(new Date(timestamp).getTime())
    ? new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    : ''

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {showAvatar && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
          isOwn 
            ? 'bg-gradient-to-br from-[var(--accent)] to-[var(--accent-blue)] text-white' 
            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)]'
        }`}>
          {senderName?.[0]?.toUpperCase() || (isOwn ? 'Y' : 'T')}
        </div>
      )}

      {/* Message bubble */}
      <div className={`flex flex-col max-w-[75%] md:max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name (for received messages) */}
        {!isOwn && senderName && (
          <div className="text-xs text-[var(--text-muted)] mb-1.5 px-3">
            {senderName}
          </div>
        )}

        {/* Bubble */}
        <div className={`relative px-4 py-2.5 rounded-2xl shadow-sm ${
          isOwn
            ? 'bg-gradient-to-br from-[var(--accent)] to-[var(--accent-blue)] text-white rounded-br-md'
            : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-bl-md border border-[var(--border-primary)]'
        }`}>
          {/* Encryption indicator */}
          {isEncrypted && (
            <div className="flex items-center gap-1.5 mb-1.5 text-xs opacity-70">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Encrypted</span>
            </div>
          )}

          {/* Content */}
          <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
            content.startsWith('[') ? 'italic opacity-70' : ''
          }`}>
            {content}
          </div>

          {/* Timestamp */}
          {time && (
            <div className={`text-[11px] mt-1.5 ${
              isOwn ? 'text-white/60' : 'text-[var(--text-muted)]'
            }`}>
              {time}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
