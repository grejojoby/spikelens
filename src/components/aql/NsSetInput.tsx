import { useState, useRef, useEffect, useMemo } from 'react'
import { Database, Table2 } from 'lucide-react'
import { useNamespaces, useSets } from '@/hooks/useRecords'

interface NsSetInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  /** nsOnly — only suggest namespace names (no .set suffix), used for DROP INDEX */
  nsOnly?: boolean
}

export default function NsSetInput({
  value,
  onChange,
  placeholder,
  className,
  nsOnly = false,
}: NsSetInputProps) {
  const [open, setOpen]       = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const wrapRef  = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Data ────────────────────────────────────────────────────────────
  const { data: nsData } = useNamespaces()
  const namespaces: string[] = (nsData ?? []).map((n: { name: string }) => n.name)

  // Extract namespace prefix before '.' to drive the sets query
  const dotIdx    = value.indexOf('.')
  const nsPart    = dotIdx > -1 ? value.slice(0, dotIdx) : ''
  const { data: setsData } = useSets(nsPart)
  const sets: string[] = (setsData ?? []).map((s: { name: string }) => s.name)

  // ── Suggestions ──────────────────────────────────────────────────────
  const suggestions = useMemo<string[]>(() => {
    if (nsOnly) {
      if (!value.trim()) return namespaces
      return namespaces.filter(n =>
        n.toLowerCase().startsWith(value.toLowerCase())
      )
    }

    if (!value.trim()) return namespaces

    if (dotIdx === -1) {
      // No dot → filter namespace names
      return namespaces.filter(n =>
        n.toLowerCase().startsWith(value.toLowerCase())
      )
    }

    // Has dot → filter sets and return as "ns.set"
    const setPrefix = value.slice(dotIdx + 1).toLowerCase()
    return sets
      .filter(s => s.toLowerCase().startsWith(setPrefix))
      .map(s => `${nsPart}.${s}`)
  }, [value, namespaces, sets, nsOnly, dotIdx, nsPart])

  // Reset keyboard cursor when list changes
  useEffect(() => setActiveIdx(-1), [suggestions])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Selection ────────────────────────────────────────────────────────
  const select = (s: string) => {
    if (!nsOnly && !s.includes('.') && namespaces.includes(s)) {
      // Namespace selected without a set → append dot, keep open, let user pick set
      onChange(s + '.')
      setOpen(true)
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      onChange(s)
      setOpen(false)
    }
  }

  // ── Keyboard ─────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !suggestions.length) {
      if (e.key === 'ArrowDown') setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      select(suggestions[activeIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showDropdown = open && suggestions.length > 0

  return (
    <div ref={wrapRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        className={className}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {showDropdown && (
        <div className="absolute top-full left-0 z-50 mt-0.5 w-full min-w-[200px] max-h-52 overflow-y-auto rounded-md border border-border bg-bg-elevated shadow-2xl py-1">
          {suggestions.map((s, i) => {
            const isNs = !s.includes('.')
            return (
              <button
                key={s}
                // preventDefault keeps input focused while clicking
                onMouseDown={e => { e.preventDefault(); select(s) }}
                className={[
                  'w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors',
                  i === activeIdx
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-muted hover:bg-white/5 hover:text-text-primary',
                ].join(' ')}
              >
                {isNs
                  ? <Database className="w-3 h-3 flex-shrink-0 text-accent/60" />
                  : <Table2   className="w-3 h-3 flex-shrink-0 text-text-disabled" />
                }
                <span className="font-mono truncate">{s}</span>
                {isNs && !nsOnly && (
                  <span className="ml-auto text-[10px] text-text-disabled flex-shrink-0">
                    → pick set
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
