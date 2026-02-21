import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import DataTable, { type Column } from '@/components/shared/DataTable'
import Button from '@/components/shared/Button'
import { useRecords } from '@/hooks/useRecords'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { Database } from 'lucide-react'
import type { RecordResponse } from '@/types'

interface RecordTableProps {
  ns: string
  set: string
  onSelect: (record: RecordResponse) => void
  selectedKey?: string
}

const LIMIT = 50

export default function RecordTable({ ns, set, onSelect, selectedKey }: RecordTableProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useRecords(ns, set, page, LIMIT)

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (!data?.records?.length) {
    return <EmptyState icon={Database} title="No records" description="This set is empty." />
  }

  // Build columns from first record's bins
  const binKeys = Array.from(
    new Set(data.records.flatMap(r => Object.keys(r.bins)))
  ).slice(0, 8)

  const columns: Column<RecordResponse>[] = [
    {
      key: '__key__',
      header: 'Key',
      width: '180px',
      accessor: r => (
        <span className="font-mono text-xs text-accent truncate block max-w-[160px]">{r.key}</span>
      ),
    },
    ...binKeys.map(bin => ({
      key: bin,
      header: bin,
      accessor: (r: RecordResponse) => {
        const v = r.bins[bin]
        if (v === null || v === undefined) return <span className="text-text-disabled">null</span>
        const str = typeof v === 'object' ? JSON.stringify(v) : String(v)
        return (
          <span className="font-mono text-xs text-text-muted truncate block max-w-[120px]" title={str}>
            {str}
          </span>
        )
      },
    })),
  ]

  return (
    <div className="flex flex-col h-full">
      <DataTable
        columns={columns}
        data={data.records}
        rowKey={(r) => r.key}
        onRowClick={onSelect}
        selectedKey={selectedKey}
        className="flex-1"
      />

      {/* Pagination */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border flex-shrink-0">
        <span className="text-xs text-text-muted">
          Page {page} · {data.total.toLocaleString()} records
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            icon={<ChevronLeft className="w-3.5 h-3.5" />}
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          />
          <Button
            size="sm"
            variant="ghost"
            icon={<ChevronRight className="w-3.5 h-3.5" />}
            disabled={!data.hasMore}
            onClick={() => setPage(p => p + 1)}
          />
        </div>
      </div>
    </div>
  )
}
