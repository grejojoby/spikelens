type BadgeVariant = 'default' | 'numeric' | 'string' | 'geo' | 'success' | 'error' | 'warn'

const variantClass: Record<BadgeVariant, string> = {
  default: 'bg-white/5 text-text-muted border-border',
  numeric: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  string: 'bg-green-500/10 text-green-400 border-green-500/20',
  geo: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  success: 'bg-success/10 text-success border-success/20',
  error: 'bg-error/10 text-error border-error/20',
  warn: 'bg-warning/10 text-warning border-warning/20',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border',
        variantClass[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
