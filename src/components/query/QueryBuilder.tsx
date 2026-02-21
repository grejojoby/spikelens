import { useState } from 'react'
import { Plus, Play } from 'lucide-react'
import Input from '@/components/shared/Input'
import Button from '@/components/shared/Button'
import FilterRow from './FilterRow'
import { useNamespaces, useSets } from '@/hooks/useRecords'
import type { QueryFilter } from '@/types'

type Mode = 'query' | 'scan'

interface QueryBuilderProps {
  onQuery: (ns: string, set: string, filters: QueryFilter[], limit: number) => void
  onScan: (ns: string, set: string, limit: number) => void
  isLoading?: boolean
}

export default function QueryBuilder({ onQuery, onScan, isLoading }: QueryBuilderProps) {
  const [mode, setMode] = useState<Mode>('scan')
  const [ns, setNs] = useState('')
  const [set, setSet] = useState('')
  const [limit, setLimit] = useState(100)
  const [filters, setFilters] = useState<QueryFilter[]>([{ bin: '', op: 'eq', value: '' }])

  const { data: namespaces } = useNamespaces()
  const { data: sets } = useSets(ns)

  const addFilter = () =>
    setFilters(f => [...f, { bin: '', op: 'eq', value: '' }])

  const updateFilter = (i: number, f: QueryFilter) =>
    setFilters(prev => { const next = [...prev]; next[i] = f; return next })

  const removeFilter = (i: number) =>
    setFilters(prev => prev.filter((_, idx) => idx !== i))

  const handleRun = () => {
    if (!ns || !set) return
    if (mode === 'scan') {
      onScan(ns, set, limit)
    } else {
      onQuery(ns, set, filters.filter(f => f.bin), limit)
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden w-fit">
        {(['scan', 'query'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={[
              'px-4 py-1.5 text-xs font-medium capitalize transition-colors',
              mode === m ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary',
            ].join(' ')}
          >
            {m === 'scan' ? 'Full Scan' : 'SI Query'}
          </button>
        ))}
      </div>

      {/* Namespace + Set selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Namespace</label>
          <select
            value={ns}
            onChange={e => { setNs(e.target.value); setSet('') }}
            className="h-9 w-full rounded-md border border-border bg-bg-surface px-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="">Select namespace…</option>
            {namespaces?.map((n: { name: string }) => (
              <option key={n.name} value={n.name}>{n.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Set</label>
          <select
            value={set}
            onChange={e => setSet(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-bg-surface px-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
            disabled={!ns}
          >
            <option value="">Select set…</option>
            {sets?.map((s: { name: string }) => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters (SI query only) */}
      {mode === 'query' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Filters</span>
            <Button size="sm" variant="ghost" icon={<Plus className="w-3 h-3" />} onClick={addFilter}>
              Add Filter
            </Button>
          </div>
          {filters.map((f, i) => (
            <FilterRow key={i} filter={f} index={i} onChange={updateFilter} onRemove={removeFilter} />
          ))}
        </div>
      )}

      {/* Limit */}
      <Input
        label="Limit"
        type="number"
        value={String(limit)}
        onChange={e => setLimit(parseInt(e.target.value) || 100)}
        hint="Maximum records to return"
      />

      {/* Run button */}
      <Button
        variant="primary"
        icon={<Play className="w-3.5 h-3.5" />}
        onClick={handleRun}
        loading={isLoading}
        disabled={!ns || !set}
        className="w-full justify-center"
      >
        {mode === 'scan' ? 'Run Scan' : 'Run Query'}
      </Button>
    </div>
  )
}
