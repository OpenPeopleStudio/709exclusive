'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import Button from '@/components/ui/Button'

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onAttach?: () => void
  disabled?: boolean
  sending?: boolean
  placeholder?: string
}

export default function MessageInput({
  value,
  onChange,
  onSend,
  onAttach,
  disabled,
  sending,
  placeholder = 'Type a message...',
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (but allow Shift+Enter for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled && !sending) {
        onSend()
      }
    }
  }

  const handleSend = () => {
    if (value.trim() && !disabled && !sending) {
      onSend()
    }
  }

  return (
    <div className="border-t border-[var(--border-primary)] bg-[var(--bg-primary)] p-3 md:p-4">
      <div className="flex items-end gap-2 md:gap-3">
        {/* Attachment button (optional) */}
        {onAttach && (
          <button
            onClick={onAttach}
            disabled={disabled}
            className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
            title="Attach file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
        )}

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className="w-full px-4 py-2.5 md:py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-full md:rounded-2xl border border-[var(--border-primary)] focus:border-[var(--accent)] focus:outline-none resize-none text-sm md:text-base placeholder:text-[var(--text-muted)]"
            style={{
              minHeight: '40px',
              maxHeight: '120px',
            }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim() || sending}
          className={`flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all ${
            value.trim() && !disabled && !sending
              ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white scale-100'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] scale-90 opacity-50'
          }`}
          title="Send message"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
      </div>

      {/* Helper text */}
      <div className="text-xs text-[var(--text-muted)] mt-2 px-4 hidden md:block">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  )
}
