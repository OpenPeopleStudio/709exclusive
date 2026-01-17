'use client'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  resultsCount?: number
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  resultsCount,
}: SearchBarProps) {
  return (
    <div className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-full md:rounded-2xl focus:border-[var(--accent)] focus:outline-none text-sm md:text-base placeholder:text-[var(--text-muted)]"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {resultsCount !== undefined && value && (
        <div className="mt-2 text-xs text-[var(--text-muted)] px-4">
          {resultsCount} {resultsCount === 1 ? 'result' : 'results'}
        </div>
      )}
    </div>
  )
}
