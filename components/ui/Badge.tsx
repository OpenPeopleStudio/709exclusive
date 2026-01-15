import { ReactNode } from 'react'

export type BadgeVariant = 'primary' | 'info' | 'time' | 'success' | 'neutral'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-[var(--accent)] text-white',
  info: 'bg-[var(--accent-blue)] text-white',
  time: 'bg-[var(--accent-amber)] text-black',
  success: 'bg-[var(--success)] text-white',
  neutral: 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-secondary)]',
}

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

// Pre-configured badge types for common use cases
export function DropBadge() {
  return <Badge variant="primary">Drop</Badge>
}

export function NewBadge() {
  return <Badge variant="info">New</Badge>
}

export function EndingSoonBadge() {
  return <Badge variant="time">Ending Soon</Badge>
}

export function PriceDropBadge() {
  return <Badge variant="success">Price Drop</Badge>
}

export function LimitedBadge() {
  return <Badge variant="neutral">Limited</Badge>
}
