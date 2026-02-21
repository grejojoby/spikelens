import StatusDot from '@/components/shared/StatusDot'
import type { NodeStat } from '@/types'

interface NodeCardProps {
  node: NodeStat
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-xs font-mono text-text-primary">{value}</span>
    </div>
  )
}

export default function NodeCard({ node }: NodeCardProps) {
  const stats = node.stats

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <StatusDot active={node.active} />
          <span className="text-sm font-medium text-text-primary truncate">{node.name}</span>
        </div>
        <span className="text-xs font-mono text-text-muted">{node.address}</span>
      </div>

      {/* Stats */}
      <div className="space-y-0.5">
        <StatRow label="Connections" value={String(node.connections)} />
        {stats['ops/sec'] && <StatRow label="Ops/sec" value={stats['ops/sec']} />}
        {stats['memory_used_bytes'] && (
          <StatRow
            label="Memory Used"
            value={formatBytes(parseInt(stats['memory_used_bytes']))}
          />
        )}
        {stats['objects'] && <StatRow label="Objects" value={Number(stats['objects']).toLocaleString()} />}
        {stats['err_rw_timeout'] && <StatRow label="RW Timeouts" value={stats['err_rw_timeout']} />}
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (isNaN(bytes)) return '—'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)}MB`
  return `${(bytes / 1024 ** 3).toFixed(1)}GB`
}
