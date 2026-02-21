import { Zap, Pencil, Trash2, PlugZap } from 'lucide-react'
import StatusDot from '@/components/shared/StatusDot'
import Button from '@/components/shared/Button'
import type { ConnectionProfile } from '@/types'

interface ConnectionCardProps {
  connection: ConnectionProfile
  onActivate: () => void
  onEdit: () => void
  onDelete: () => void
  onTest: () => void
  activating?: boolean
  testing?: boolean
}

export default function ConnectionCard({
  connection,
  onActivate,
  onEdit,
  onDelete,
  onTest,
  activating,
  testing,
}: ConnectionCardProps) {
  return (
    <div
      className={[
        'rounded-xl border p-4 flex flex-col gap-3 transition-colors',
        connection.active
          ? 'border-accent/40 bg-accent/5'
          : 'border-border bg-bg-surface hover:border-border/80',
      ].join(' ')}
    >
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <StatusDot active={connection.active} />
          <span className="font-medium text-sm text-text-primary truncate">{connection.name}</span>
        </div>
        {connection.active && (
          <span className="text-xs text-accent font-medium">Active</span>
        )}
      </div>

      {/* Connection details */}
      <div className="font-mono text-xs text-text-muted">
        {connection.host}:{connection.port}
        {connection.user && <span className="ml-2 text-text-disabled">@{connection.user}</span>}
        {connection.tlsEnable && <span className="ml-2 text-warning">TLS</span>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-1">
        <Button
          size="sm"
          variant={connection.active ? 'ghost' : 'primary'}
          icon={<PlugZap className="w-3 h-3" />}
          loading={activating}
          onClick={onActivate}
          disabled={connection.active}
        >
          {connection.active ? 'Active' : 'Connect'}
        </Button>
        <Button size="sm" variant="ghost" icon={<Zap className="w-3 h-3" />} loading={testing} onClick={onTest}>
          Test
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" icon={<Pencil className="w-3 h-3" />} onClick={onEdit} />
        <Button size="sm" variant="danger" icon={<Trash2 className="w-3 h-3" />} onClick={onDelete} />
      </div>
    </div>
  )
}
