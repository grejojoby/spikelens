import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
        <Icon className="w-6 h-6 text-text-muted" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        {description && <p className="text-xs text-text-muted max-w-xs">{description}</p>}
      </div>
      {action}
    </div>
  )
}
