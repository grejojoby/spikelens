import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-muted">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={[
            'h-9 w-full rounded-md border bg-bg-surface px-3 text-sm text-text-primary placeholder:text-text-disabled',
            'focus:outline-none focus:ring-2 focus:ring-accent/50',
            error ? 'border-error' : 'border-border',
            className,
          ].join(' ')}
          {...rest}
        />
        {error && <p className="text-xs text-error">{error}</p>}
        {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export default Input
