import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import DataTable from '@/components/shared/DataTable'
import type { AQLResult } from '@/types'

interface AQLResultPaneProps {
  result: AQLResult | null
}

export default function AQLResultPane({ result }: AQLResultPaneProps) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-text-disabled">
        Run an AQL statement to see results
      </div>
    )
  }

  const hasRows = result.rows && result.rows.length > 0
  const hasError = !!result.error
  const hasMessage = !!result.message

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border flex-shrink-0">
        {hasError ? (
          <XCircle className="w-3.5 h-3.5 text-error flex-shrink-0" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
        )}
        <span className={['text-xs flex-1 truncate', hasError ? 'text-error' : 'text-text-muted'].join(' ')}>
          {hasError ? result.error : hasMessage ? result.message : `${result.rows?.length ?? 0} rows`}
        </span>
        <div className="flex items-center gap-1 text-xs text-text-disabled flex-shrink-0">
          <Clock className="w-3 h-3" />
          {result.durationMs}ms
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {hasError || !hasRows ? (
          hasMessage && !hasError && (
            <div className="p-4 text-xs font-mono text-text-muted whitespace-pre-wrap">{result.message}</div>
          )
        ) : (
          <DataTable
            columns={result.columns.map(col => ({
              key: col,
              header: col,
              accessor: (row: Record<string, unknown>) => {
                const v = row[col]
                if (v === null || v === undefined) return <span className="text-text-disabled">null</span>
                const str = typeof v === 'object' ? JSON.stringify(v) : String(v)
                return <span className="font-mono text-xs">{str}</span>
              },
            }))}
            data={result.rows}
            rowKey={(_row, i) => String(i)}
          />
        )}
      </div>
    </div>
  )
}
