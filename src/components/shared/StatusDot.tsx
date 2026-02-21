interface StatusDotProps {
  active: boolean
  size?: 'sm' | 'md'
}

export default function StatusDot({ active, size = 'md' }: StatusDotProps) {
  const sz = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
  return (
    <span
      className={[sz, 'rounded-full flex-shrink-0', active ? 'bg-success' : 'bg-text-disabled'].join(' ')}
      aria-label={active ? 'Connected' : 'Disconnected'}
    />
  )
}
