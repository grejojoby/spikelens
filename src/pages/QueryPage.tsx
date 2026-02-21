import QueryBuilder from '@/components/query/QueryBuilder'
import DataTable, { type Column } from '@/components/shared/DataTable'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Search } from 'lucide-react'
import { useExecuteQuery, useExecuteScan } from '@/hooks/useQueryExec'
import type { RecordResponse, QueryFilter } from '@/types'

export default function QueryPage() {
  const queryMut = useExecuteQuery()
  const scanMut = useExecuteScan()

  const isLoading = queryMut.isPending || scanMut.isPending
  const results = queryMut.data ?? scanMut.data ?? []

  const handleQuery = (ns: string, set: string, filters: QueryFilter[], limit: number) => {
    queryMut.mutate({ namespace: ns, set, filters, limit })
  }

  const handleScan = (ns: string, set: string, limit: number) => {
    scanMut.mutate({ namespace: ns, set, limit })
  }

  // Build columns from result data
  const binKeys = Array.from(
    new Set(results.flatMap(r => Object.keys(r.bins)))
  ).slice(0, 8)

  const columns: Column<RecordResponse>[] = [
    {
      key: '__key__',
      header: 'Key',
      width: '160px',
      accessor: r => <span className="font-mono text-accent truncate block max-w-[140px]">{r.key}</span>,
    },
    ...binKeys.map(bin => ({
      key: bin,
      header: bin,
      accessor: (r: RecordResponse) => {
        const v = r.bins[bin]
        if (v == null) return <span className="text-text-disabled">null</span>
        const str = typeof v === 'object' ? JSON.stringify(v) : String(v)
        return <span className="font-mono text-xs truncate block max-w-[120px]">{str}</span>
      },
    })),
  ]

  return (
    <div className="flex h-full">
      {/* Query panel */}
      <div className="w-72 flex-shrink-0 border-r border-border overflow-y-auto">
        <QueryBuilder
          onQuery={handleQuery}
          onScan={handleScan}
          isLoading={isLoading}
        />
      </div>

      {/* Results */}
      <div className="flex-1 min-w-0 overflow-auto">
        {isLoading ? (
          <LoadingSpinner className="py-16" />
        ) : results.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No results"
            description="Configure a query and press run to see records."
          />
        ) : (
          <div>
            <div className="px-3 py-2 border-b border-border text-xs text-text-muted">
              {results.length.toLocaleString()} records
            </div>
            <DataTable
              columns={columns}
              data={results}
              rowKey={(r) => r.key}
            />
          </div>
        )}
      </div>
    </div>
  )
}
