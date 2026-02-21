import { useState } from 'react'
import { ChevronRight, ChevronDown, Database, Table2, RefreshCw } from 'lucide-react'
import { useNamespaces, useSets } from '@/hooks/useRecords'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

interface NamespaceTreeProps {
  selectedNs: string
  selectedSet: string
  onSelect: (ns: string, set: string) => void
}

function SetsList({
  ns,
  selectedSet,
  onSelect,
}: {
  ns: string
  selectedSet: string
  onSelect: (set: string) => void
}) {
  const { data: sets, isLoading } = useSets(ns)

  if (isLoading) return <div className="pl-8 py-1"><LoadingSpinner size="sm" /></div>
  if (!sets?.length) return (
    <div className="pl-8 py-1 text-xs text-text-disabled">No sets</div>
  )

  return (
    <>
      {sets.map((set: { name: string; recordCount: number }) => (
        <button
          key={set.name}
          onClick={() => onSelect(set.name)}
          className={[
            'w-full flex items-center gap-2 px-3 py-1.5 pl-8 text-xs transition-colors text-left',
            selectedSet === set.name
              ? 'bg-accent/10 text-accent'
              : 'text-text-muted hover:text-text-primary hover:bg-white/5',
          ].join(' ')}
        >
          <Table2 className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{set.name}</span>
          <span className="ml-auto text-text-disabled tabular-nums">
            {set.recordCount.toLocaleString()}
          </span>
        </button>
      ))}
    </>
  )
}

export default function NamespaceTree({ selectedNs, selectedSet, onSelect }: NamespaceTreeProps) {
  const { data: namespaces, isLoading, refetch } = useNamespaces()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (ns: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(ns)) {
        next.delete(ns)
      } else {
        next.add(ns)
      }
      return next
    })
  }

  if (isLoading) return <LoadingSpinner className="py-8" />

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-text-muted">Namespaces</span>
        <button
          onClick={() => refetch()}
          className="text-text-muted hover:text-text-primary transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tree */}
      {namespaces?.map((ns: { name: string }) => {
        const isOpen = expanded.has(ns.name)
        return (
          <div key={ns.name}>
            <button
              onClick={() => toggle(ns.name)}
              className={[
                'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors text-left',
                selectedNs === ns.name && !selectedSet
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-primary hover:bg-white/5',
              ].join(' ')}
            >
              {isOpen
                ? <ChevronDown className="w-3 h-3 flex-shrink-0" />
                : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
              <Database className="w-3 h-3 flex-shrink-0 text-accent" />
              <span className="truncate">{ns.name}</span>
            </button>

            {isOpen && (
              <SetsList
                ns={ns.name}
                selectedSet={selectedNs === ns.name ? selectedSet : ''}
                onSelect={(set) => onSelect(ns.name, set)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
