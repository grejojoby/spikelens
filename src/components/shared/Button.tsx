import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover disabled:opacity-40',
  ghost: 'text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent hover:border-border disabled:opacity-40',
  danger: 'text-error hover:bg-error/10 border border-transparent hover:border-error/30 disabled:opacity-40',
}

const sizeClass: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'ghost', size = 'md', loading, icon, children, className = '', disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 cursor-pointer',
        variantClass[variant],
        sizeClass[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : icon}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

export default Button
