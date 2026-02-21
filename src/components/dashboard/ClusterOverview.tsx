import type { NodeStat } from '@/types'

interface ClusterOverviewProps {
  nodes: NodeStat[]
  connected: boolean
}

export default function ClusterOverview({ nodes, connected }: ClusterOverviewProps) {
  const activeNodes = nodes.filter(n => n.active).length
  const totalConns = nodes.reduce((sum, n) => sum + n.connections, 0)

  const stat = (label: string, value: string | number, sub?: string) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xl font-semibold text-text-primary tabular-nums">{value}</span>
      <span className="text-xs text-text-muted">{label}</span>
      {sub && <span className="text-xs text-text-disabled">{sub}</span>}
    </div>
  )

  return (
    <div className="flex items-center gap-8 px-6 py-4 border-b border-border">
      <div className="flex items-center gap-2">
        <div className={['w-2 h-2 rounded-full', connected ? 'bg-success' : 'bg-text-disabled'].join(' ')} />
        <span className="text-sm font-medium text-text-primary">
          {connected ? 'Live' : 'Disconnected'}
        </span>
      </div>
      <div className="w-px h-8 bg-border" />
      {stat('Total Nodes', nodes.length)}
      {stat('Active', activeNodes)}
      {stat('Connections', totalConns)}
    </div>
  )
}
