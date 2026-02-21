import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  accessor: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T, index: number) => string
  onRowClick?: (row: T) => void
  selectedKey?: string
  emptyMessage?: string
  className?: string
}

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  selectedKey,
  emptyMessage = 'No data',
  className = '',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (col: Column<T>) => {
    if (!col.sortable) return
    if (sortKey === col.key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col.key)
      setSortDir('asc')
    }
  }

  return (
    <div className={['w-full overflow-auto', className].join(' ')}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            {columns.map(col => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                onClick={() => handleSort(col)}
                className={[
                  'px-3 py-2.5 text-left text-xs font-medium text-text-muted select-none',
                  col.sortable ? 'cursor-pointer hover:text-text-primary' : '',
                ].join(' ')}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    sortDir === 'asc'
                      ? <ChevronUp className="w-3 h-3" />
                      : <ChevronDown className="w-3 h-3" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-xs text-text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const key = rowKey(row, idx)
              const isSelected = selectedKey === key
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  className={[
                    'border-b border-border/50 transition-colors',
                    onRowClick ? 'cursor-pointer' : '',
                    isSelected ? 'bg-accent/10' : 'hover:bg-white/[0.02]',
                  ].join(' ')}
                >
                  {columns.map(col => (
                    <td key={col.key} className="px-3 py-2.5 text-xs text-text-primary align-top">
                      {col.accessor(row)}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
