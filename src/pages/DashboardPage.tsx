import { useAppStore } from '@/store/appStore'
import { useClusterStats } from '@/hooks/useClusterStats'
import ClusterOverview from '@/components/dashboard/ClusterOverview'
import NodeCard from '@/components/dashboard/NodeCard'
import EmptyState from '@/components/shared/EmptyState'
import { BarChart2 } from 'lucide-react'

export default function DashboardPage() {
  const { activeConnectionId } = useAppStore()
  const { nodes, connected } = useClusterStats(!!activeConnectionId)

  if (!activeConnectionId) {
    return (
      <EmptyState
        icon={BarChart2}
        title="No active connection"
        description="Connect to a cluster to view live statistics."
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ClusterOverview nodes={nodes} connected={connected} />

      <div className="flex-1 overflow-auto p-6">
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-xs text-text-disabled">
            {connected ? 'Waiting for node data…' : 'Connecting…'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map(node => (
              <NodeCard key={node.name} node={node} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
