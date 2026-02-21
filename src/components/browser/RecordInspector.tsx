import { useState } from 'react'
import { X, Save, Trash2 } from 'lucide-react'
import Button from '@/components/shared/Button'
import { useUpdateRecord, useDeleteRecord } from '@/hooks/useRecords'
import type { RecordResponse } from '@/types'

interface RecordInspectorProps {
  record: RecordResponse
  ns: string
  set: string
  onClose: () => void
}

function ValueEditor({
  binKey,
  value,
  onChange,
}: {
  binKey: string
  value: unknown
  onChange: (key: string, v: unknown) => void
}) {
  const type = typeof value

  if (type === 'number') {
    return (
      <input
        type="number"
        defaultValue={String(value)}
        onBlur={e => onChange(binKey, parseFloat(e.target.value))}
        className="w-full rounded border border-border bg-bg-base px-2 py-1 text-xs font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
      />
    )
  }

  if (type === 'boolean') {
    return (
      <select
        defaultValue={String(value)}
        onChange={e => onChange(binKey, e.target.value === 'true')}
        className="rounded border border-border bg-bg-base px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    )
  }

  if (type === 'object' && value !== null) {
    return (
      <textarea
        defaultValue={JSON.stringify(value, null, 2)}
        onBlur={e => {
          try { onChange(binKey, JSON.parse(e.target.value)) } catch {}
        }}
        rows={4}
        className="w-full rounded border border-border bg-bg-base px-2 py-1 text-xs font-mono text-text-primary resize-y focus:outline-none focus:ring-1 focus:ring-accent"
      />
    )
  }

  return (
    <input
      type="text"
      defaultValue={String(value ?? '')}
      onBlur={e => onChange(binKey, e.target.value)}
      className="w-full rounded border border-border bg-bg-base px-2 py-1 text-xs font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
    />
  )
}

export default function RecordInspector({ record, ns, set, onClose }: RecordInspectorProps) {
  const [bins, setBins] = useState<Record<string, unknown>>({ ...record.bins })
  const updateMut = useUpdateRecord()
  const deleteMut = useDeleteRecord()

  const handleBinChange = (key: string, value: unknown) => {
    setBins(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    updateMut.mutate({ ns, set, key: record.key, bins })
  }

  const handleDelete = () => {
    deleteMut.mutate({ ns, set, key: record.key }, { onSuccess: onClose })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-primary truncate">Record</p>
          <p className="text-xs font-mono text-text-muted truncate">{record.key}</p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary ml-2 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Meta */}
      <div className="px-4 py-2 border-b border-border flex gap-4 text-xs text-text-muted flex-shrink-0">
        <span>Gen: {record.generation}</span>
        <span>TTL: {record.expiry === 0 ? '∞' : record.expiry}</span>
        <span>Bins: {Object.keys(record.bins).length}</span>
      </div>

      {/* Bins */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {Object.entries(bins).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <label className="text-xs font-medium text-text-muted">{key}</label>
            <ValueEditor binKey={key} value={value} onChange={handleBinChange} />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border flex-shrink-0">
        <Button
          variant="primary"
          size="sm"
          icon={<Save className="w-3 h-3" />}
          loading={updateMut.isPending}
          onClick={handleSave}
        >
          Save
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 className="w-3 h-3" />}
          loading={deleteMut.isPending}
          onClick={handleDelete}
        >
          Delete
        </Button>
      </div>
    </div>
  )
}
