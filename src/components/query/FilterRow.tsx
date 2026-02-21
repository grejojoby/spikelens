import { Trash2 } from 'lucide-react'
import Input from '@/components/shared/Input'
import Button from '@/components/shared/Button'
import type { QueryFilter } from '@/types'

interface FilterRowProps {
  filter: QueryFilter
  index: number
  onChange: (i: number, f: QueryFilter) => void
  onRemove: (i: number) => void
}

const OPS = [
  { value: 'eq', label: '=' },
  { value: 'range', label: 'BETWEEN' },
]

export default function FilterRow({ filter, index, onChange, onRemove }: FilterRowProps) {
  const update = (patch: Partial<QueryFilter>) =>
    onChange(index, { ...filter, ...patch })

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Input
          label={index === 0 ? 'Bin' : undefined}
          value={filter.bin}
          onChange={e => update({ bin: e.target.value })}
          placeholder="bin_name"
        />
      </div>

      <div className="w-28">
        {index === 0 && <label className="block text-xs font-medium text-text-muted mb-1">Op</label>}
        <select
          value={filter.op}
          onChange={e => update({ op: e.target.value as QueryFilter['op'] })}
          className="h-9 w-full rounded-md border border-border bg-bg-surface px-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          {OPS.map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <Input
          label={index === 0 ? 'Value' : undefined}
          value={String(filter.value ?? '')}
          onChange={e => update({ value: e.target.value })}
          placeholder={filter.op === 'range' ? 'low,high' : 'value'}
        />
      </div>

      <Button
        variant="danger"
        size="sm"
        icon={<Trash2 className="w-3 h-3" />}
        onClick={() => onRemove(index)}
        className={index === 0 ? 'mb-0' : ''}
      />
    </div>
  )
}
