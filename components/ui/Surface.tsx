import type { HTMLAttributes } from 'react'

type SurfaceVariant = 'default' | 'elevated' | 'outline'
type SurfacePadding = 'none' | 'sm' | 'md' | 'lg'

const variants: Record<SurfaceVariant, string> = {
  default: 'bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[var(--radius-xl)]',
  elevated: 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-xl)]',
  outline: 'border border-[var(--border-primary)] rounded-[var(--radius-xl)]',
}

const padding: Record<SurfacePadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  variant?: SurfaceVariant
  padding?: SurfacePadding
}

export default function Surface({
  variant = 'default',
  padding: pad = 'md',
  className = '',
  ...props
}: SurfaceProps) {
  const classes = [variants[variant], padding[pad], className]
    .filter(Boolean)
    .join(' ')

  return <div {...props} className={classes} />
}
