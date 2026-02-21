import { Clock } from 'lucide-react'

interface AQLHistoryProps {
  history: string[]
  onSelect: (stmt: string) => void
}

export default function AQLHistory({ history, onSelect }: AQLHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-xs text-text-disabled">
        No history yet
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {history.map((stmt, i) => (
        <button
          key={i}
          onClick={() => onSelect(stmt)}
          title={stmt}
          className="flex items-start gap-2 px-3 py-2.5 text-left hover:bg-white/5 transition-colors border-b border-border/40 last:border-0"
        >
          <Clock className="w-3 h-3 text-text-disabled mt-0.5 flex-shrink-0" />
          <span className="text-xs font-mono text-text-muted truncate leading-relaxed">
            {stmt.slice(0, 60)}{stmt.length > 60 ? '…' : ''}
          </span>
        </button>
      ))}
    </div>
  )
}
