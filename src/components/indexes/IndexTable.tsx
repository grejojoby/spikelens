import { Trash2 } from 'lucide-react'
import DataTable, { type Column } from '@/components/shared/DataTable'
import Button from '@/components/shared/Button'
import Badge from '@/components/shared/Badge'
import type { SecondaryIndex } from '@/types'

interface IndexTableProps {
  indexes: SecondaryIndex[]
  onDrop: (idx: SecondaryIndex) => void
  droppingName?: string
}

const typeVariant = {
  NUMERIC: 'numeric',
  STRING: 'string',
  GEO2DSPHERE: 'geo',
} as const

export default function IndexTable({ indexes, onDrop, droppingName }: IndexTableProps) {
  const columns: Column<SecondaryIndex>[] = [
    { key: 'name', header: 'Name', accessor: r => r.name },
    { key: 'namespace', header: 'Namespace', accessor: r => r.namespace },
    { key: 'set', header: 'Set', accessor: r => r.set || <span className="text-text-disabled">—</span> },
    { key: 'binName', header: 'Bin', accessor: r => <span className="font-mono">{r.binName}</span> },
    {
      key: 'type',
      header: 'Type',
      accessor: r => (
        <Badge variant={typeVariant[r.type] ?? 'default'}>{r.type}</Badge>
      ),
    },
    {
      key: 'state',
      header: 'State',
      accessor: r => (
        <Badge variant={r.state === 'READY' ? 'success' : 'warn'}>{r.state}</Badge>
      ),
    },
    {
      key: '__actions__',
      header: '',
      width: '60px',
      accessor: r => (
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 className="w-3 h-3" />}
          loading={droppingName === r.name}
          onClick={(e) => { e.stopPropagation(); onDrop(r) }}
        />
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={indexes}
      rowKey={(r) => `${r.namespace}.${r.name}`}
      emptyMessage="No secondary indexes found"
    />
  )
}
