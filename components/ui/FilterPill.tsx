'use client'

interface FilterPillProps {
  label: string
  selected: boolean
  onClick: () => void
  size?: 'sm' | 'md'
}

export default function FilterPill({ label, selected, onClick, size = 'md' }: FilterPillProps) {
  const sizeClasses = size === 'sm' 
    ? 'px-2.5 py-1 text-xs' 
    : 'px-3 py-1.5 text-sm'

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses} rounded-full font-medium transition-colors ${
        selected
          ? 'bg-[var(--accent)] text-white'
          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
      }`}
    >
      {label}
    </button>
  )
}

// Size button variant (square for sizes)
export function SizeButton({ label, selected, onClick, disabled = false }: FilterPillProps & { disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-11 h-11 text-sm rounded-lg font-medium transition-colors ${
        disabled 
          ? 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
          : selected
            ? 'bg-[var(--accent)] text-white'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
      }`}
    >
      {label}
    </button>
  )
}

// Condition button variant
export function ConditionButton({ label, selected, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm rounded-lg font-medium transition-colors ${
        selected
          ? 'bg-[var(--accent)] text-white'
          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
      }`}
    >
      {label}
    </button>
  )
}
