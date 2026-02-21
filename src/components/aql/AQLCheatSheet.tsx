import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

const SNIPPETS = [
  { label: 'Scan all', stmt: "SELECT * FROM namespace.set LIMIT 100" },
  { label: 'Get by PK', stmt: "SELECT * FROM namespace.set WHERE PK = 'key'" },
  { label: 'Equal filter', stmt: "SELECT * FROM namespace.set WHERE bin = 'value'" },
  { label: 'Range filter', stmt: "SELECT * FROM namespace.set WHERE age BETWEEN 18 AND 65" },
  { label: 'Select bins', stmt: "SELECT bin1, bin2 FROM namespace.set LIMIT 50" },
  { label: 'Insert', stmt: "INSERT INTO namespace.set (PK, bin1, bin2) VALUES ('key', 'val1', 42)" },
  { label: 'Delete by PK', stmt: "DELETE FROM namespace.set WHERE PK = 'key'" },
  { label: 'Create index', stmt: "CREATE INDEX idx_name ON namespace.set (bin_name) NUMERIC" },
  { label: 'Drop index', stmt: "DROP INDEX namespace.idx_name" },
  { label: 'Show namespaces', stmt: "SHOW NAMESPACES" },
  { label: 'Show sets', stmt: "SHOW SETS" },
  { label: 'Show indexes', stmt: "SHOW INDEXES" },
]

export default function AQLCheatSheet({ onSelect }: { onSelect: (stmt: string) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
      >
        Quick Reference
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {open && (
        <div className="flex flex-col">
          {SNIPPETS.map(({ label, stmt }) => (
            <button
              key={label}
              onClick={() => onSelect(stmt)}
              className="px-3 py-1.5 text-left hover:bg-white/5 transition-colors"
            >
              <p className="text-xs font-medium text-text-muted">{label}</p>
              <p className="text-xs font-mono text-text-disabled truncate">{stmt}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
