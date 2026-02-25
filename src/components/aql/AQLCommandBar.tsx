import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Play, Wand2 } from 'lucide-react'
import Button from '@/components/shared/Button'
import NsSetInput from './NsSetInput'

// ── Types ─────────────────────────────────────────────────────────────

type CmdId =
  | 'SELECT_SCAN'
  | 'SELECT_PK'
  | 'SELECT_EQ'
  | 'SELECT_RANGE'
  | 'SELECT_BINS'
  | 'INSERT'
  | 'DELETE'
  | 'CREATE_INDEX'
  | 'DROP_INDEX'
  | 'SHOW'

interface Field {
  id: string
  label: string
  placeholder: string
  type?: 'text' | 'select' | 'textarea'
  options?: string[]
  width?: string        // tailwind class e.g. 'flex-1' | 'w-24'
  autocomplete?: 'nset' | 'ns'
}

interface Command {
  id: CmdId
  method: string      // shown on the badge button
  label: string       // shown in dropdown list
  color: ColorKey
  fields: Field[]
  build: (v: Record<string, string>) => string
}

type ColorKey = 'orange' | 'green' | 'red' | 'blue' | 'gray' | 'purple'

// ── Helpers ───────────────────────────────────────────────────────────

function isNumeric(s: string) {
  return s.trim() !== '' && !isNaN(Number(s.trim()))
}

/** Quote a value for AQL unless it looks numeric/boolean/null */
function fmtVal(s: string): string {
  const t = s.trim()
  if (!t) return "''"
  if (isNumeric(t) || t === 'true' || t === 'false' || t === 'null') return t
  return `'${t}'`
}

/** Parse "bin = value" lines into key/value pairs */
function parseBins(raw: string): Array<{ key: string; value: string }> {
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .flatMap(line => {
      const eq = line.indexOf('=')
      if (eq === -1) return []
      return [{ key: line.slice(0, eq).trim(), value: line.slice(eq + 1).trim() }]
    })
}

// ── Command definitions ───────────────────────────────────────────────

const COMMANDS: Command[] = [
  {
    id: 'SELECT_SCAN',
    method: 'SELECT',
    label: 'Scan all records',
    color: 'orange',
    fields: [
      { id: 'nset', label: 'Namespace.Set', placeholder: 'namespace.set', width: 'flex-1', autocomplete: 'nset' },
      { id: 'limit', label: 'Limit', placeholder: '100', width: 'w-20' },
    ],
    build: v =>
      `SELECT * FROM ${v.nset || 'namespace.set'} LIMIT ${v.limit || '100'}`,
  },
  {
    id: 'SELECT_PK',
    method: 'SELECT',
    label: 'Get by primary key',
    color: 'orange',
    fields: [
      { id: 'nset', label: 'Namespace.Set', placeholder: 'namespace.set', width: 'flex-1', autocomplete: 'nset' },
      { id: 'pk', label: 'Primary Key', placeholder: 'my-record-key', width: 'flex-1' },
    ],
    build: v =>
      `SELECT * FROM ${v.nset || 'namespace.set'} WHERE PK = '${v.pk || ''}'`,
  },
  {
    id: 'SELECT_EQ',
    method: 'SELECT',
    label: 'Filter by bin (equals)',
    color: 'orange',
    fields: [
      { id: 'nset', label: 'Namespace.Set', placeholder: 'namespace.set', width: 'flex-1', autocomplete: 'nset' },
      { id: 'bin', label: 'Bin', placeholder: 'bin_name', width: 'w-28' },
      { id: 'value', label: 'Value', placeholder: 'value', width: 'w-32' },
      { id: 'limit', label: 'Limit', placeholder: '100', width: 'w-20' },
    ],
    build: v =>
      `SELECT * FROM ${v.nset || 'namespace.set'} WHERE ${v.bin || 'bin'} = ${fmtVal(v.value || '')} LIMIT ${v.limit || '100'}`,
  },
  {
    id: 'SELECT_RANGE',
    method: 'SELECT',
    label: 'Filter by bin (range)',
    color: 'orange',
    fields: [
      { id: 'nset', label: 'Namespace.Set', placeholder: 'namespace.set', width: 'flex-1', autocomplete: 'nset' },
      { id: 'bin', label: 'Bin', placeholder: 'bin_name', width: 'w-28' },
      { id: 'min', label: 'Min', placeholder: '0', width: 'w-20' },
      { id: 'max', label: 'Max', placeholder: '100', width: 'w-20' },
      { id: 'limit', label: 'Limit', placeholder: '100', width: 'w-20' },
    ],
    build: v =>
      `SELECT * FROM ${v.nset || 'namespace.set'} WHERE ${v.bin || 'bin'} BETWEEN ${v.min || '0'} AND ${v.max || '100'} LIMIT ${v.limit || '100'}`,
  },
  {
    id: 'SELECT_BINS',
    method: 'SELECT',
    label: 'Select specific bins',
    color: 'orange',
    fields: [
      { id: 'nset', label: 'Namespace.Set', placeholder: 'namespace.set', width: 'flex-1', autocomplete: 'nset' },
      { id: 'bins', label: 'Bins (comma-separated)', placeholder: 'bin1, bin2, bin3', width: 'flex-1' },
      { id: 'limit', label: 'Limit', placeholder: '100', width: 'w-20' },
    ],
    build: v =>
      `SELECT ${v.bins || '*'} FROM ${v.nset || 'namespace.set'} LIMIT ${v.limit || '100'}`,
  },
  {
    id: 'INSERT',
    method: 'INSERT',
    label: 'Insert record',
    color: 'green',
    fields: [
      { id: 'nset', label: 'Namespace.Set', placeholder: 'namespace.set', width: 'w-44', autocomplete: 'nset' },
      { id: 'pk', label: 'Primary Key', placeholder: 'my-record-key', width: 'w-40' },
      {
        id: 'bindata',
        label: 'Bins — one per line: name = value',
        placeholder: 'name = John\nage = 25\ncity = NYC',
        type: 'textarea',
        width: 'flex-1',
      },
    ],
    build: v => {
      const entries = parseBins(v.bindata || '')
      const cols = ['PK', ...entries.map(e => e.key)].join(', ')
      const vals = [`'${v.pk || ''}'`, ...entries.map(e => fmtVal(e.value))].join(', ')
      return `INSERT INTO ${v.nset || 'namespace.set'} (${cols}) VALUES (${vals})`
    },
  },
  {
    id: 'DELETE',
    method: 'DELETE',
    label: 'Delete by primary key',
    color: 'red',
    fields: [
      { id: 'nset', label: 'Namespace.Set', placeholder: 'namespace.set', width: 'flex-1', autocomplete: 'nset' },
      { id: 'pk', label: 'Primary Key', placeholder: 'my-record-key', width: 'flex-1' },
    ],
    build: v =>
      `DELETE FROM ${v.nset || 'namespace.set'} WHERE PK = '${v.pk || ''}'`,
  },
  {
    id: 'CREATE_INDEX',
    method: 'CREATE',
    label: 'Create secondary index',
    color: 'blue',
    fields: [
      { id: 'nset', label: 'Namespace.Set', placeholder: 'namespace.set', width: 'flex-1', autocomplete: 'nset' },
      { id: 'idxname', label: 'Index Name', placeholder: 'idx_name', width: 'w-36' },
      { id: 'bin', label: 'Bin', placeholder: 'bin_name', width: 'w-28' },
      {
        id: 'type',
        label: 'Type',
        type: 'select',
        placeholder: 'NUMERIC',
        options: ['NUMERIC', 'STRING', 'GEO2DSPHERE'],
        width: 'w-36',
      },
    ],
    build: v =>
      `CREATE INDEX ${v.idxname || 'idx_name'} ON ${v.nset || 'namespace.set'} (${v.bin || 'bin_name'}) ${v.type || 'NUMERIC'}`,
  },
  {
    id: 'DROP_INDEX',
    method: 'DROP',
    label: 'Drop index',
    color: 'gray',
    fields: [
      { id: 'namespace', label: 'Namespace', placeholder: 'namespace', width: 'flex-1', autocomplete: 'ns' },
      { id: 'idxname', label: 'Index Name', placeholder: 'idx_name', width: 'flex-1' },
    ],
    build: v =>
      `DROP INDEX ${v.namespace || 'namespace'}.${v.idxname || 'idx_name'}`,
  },
  {
    id: 'SHOW',
    method: 'SHOW',
    label: 'Show objects',
    color: 'purple',
    fields: [
      {
        id: 'what',
        label: 'Show',
        type: 'select',
        placeholder: 'NAMESPACES',
        options: ['NAMESPACES', 'SETS', 'INDEXES'],
        width: 'w-44',
      },
    ],
    build: v => `SHOW ${v.what || 'NAMESPACES'}`,
  },
]

// ── Color maps ────────────────────────────────────────────────────────

const COLORS: Record<ColorKey, { badge: string; text: string }> = {
  orange: { badge: 'text-orange-400 bg-orange-500/10 border-orange-500/25', text: 'text-orange-400' },
  green:  { badge: 'text-green-400 bg-green-500/10 border-green-500/25',   text: 'text-green-400'  },
  red:    { badge: 'text-red-400 bg-red-500/10 border-red-500/25',         text: 'text-red-400'    },
  blue:   { badge: 'text-blue-400 bg-blue-500/10 border-blue-500/25',      text: 'text-blue-400'   },
  gray:   { badge: 'text-text-muted bg-white/5 border-border',             text: 'text-text-muted' },
  purple: { badge: 'text-purple-400 bg-purple-500/10 border-purple-500/25', text: 'text-purple-400' },
}

// ── Shared field input styles ─────────────────────────────────────────

const inputCls =
  'h-7 w-full rounded border border-border bg-bg-surface px-2 text-xs text-text-primary ' +
  'placeholder:text-text-disabled font-mono focus:outline-none focus:ring-1 focus:ring-accent/50'

const selectCls =
  'h-7 w-full rounded border border-border bg-bg-surface px-2 text-xs text-text-primary ' +
  'font-mono focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer'

const textareaCls =
  'w-full rounded border border-border bg-bg-surface px-2 py-1.5 text-xs text-text-primary ' +
  'placeholder:text-text-disabled font-mono focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none leading-relaxed'

// ── Props ─────────────────────────────────────────────────────────────

interface AQLCommandBarProps {
  onBuild: (stmt: string) => void
  onExecute: (stmt: string) => void
  isLoading?: boolean
}

// ── Component ─────────────────────────────────────────────────────────

export default function AQLCommandBar({ onBuild, onExecute, isLoading }: AQLCommandBarProps) {
  const [cmdId, setCmdId] = useState<CmdId>('SELECT_SCAN')
  const [values, setValues] = useState<Record<string, string>>({})
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const cmd = COMMANDS.find(c => c.id === cmdId)!
  const colors = COLORS[cmd.color]
  const hasTextarea = cmd.fields.some(f => f.type === 'textarea')

  const selectCmd = (id: CmdId) => {
    setCmdId(id)
    setValues({})
    setDropdownOpen(false)
  }

  const setValue = (field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }

  // Initialise select fields to their first option
  const getVal = (field: Field) => {
    if (values[field.id] !== undefined) return values[field.id]
    if (field.type === 'select') return field.options?.[0] ?? ''
    return ''
  }

  const buildStmt = () => {
    const v: Record<string, string> = {}
    cmd.fields.forEach(f => { v[f.id] = getVal(f) })
    return cmd.build(v)
  }

  const handleBuild = () => onBuild(buildStmt())

  const handleBuildAndRun = () => {
    const stmt = buildStmt()
    onBuild(stmt)
    onExecute(stmt)
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Render a single field ────────────────────────────────────────────

  const renderField = (field: Field) => {
    const val = getVal(field)

    if (field.type === 'textarea') {
      return (
        <div key={field.id} className={`${field.width ?? 'flex-1'} flex flex-col gap-0.5 min-w-0`}>
          <span className="text-[10px] text-text-disabled px-0.5">{field.label}</span>
          <textarea
            rows={3}
            value={val}
            onChange={e => setValue(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={textareaCls}
          />
        </div>
      )
    }

    if (field.type === 'select') {
      return (
        <div key={field.id} className={`${field.width ?? 'w-36'} flex flex-col gap-0.5 min-w-0`}>
          <span className="text-[10px] text-text-disabled px-0.5">{field.label}</span>
          <select
            value={val}
            onChange={e => setValue(field.id, e.target.value)}
            className={selectCls}
          >
            {field.options?.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      )
    }

    if (field.autocomplete === 'nset' || field.autocomplete === 'ns') {
      return (
        <div key={field.id} className={`${field.width ?? 'flex-1'} flex flex-col gap-0.5 min-w-0`}>
          <span className="text-[10px] text-text-disabled px-0.5">{field.label}</span>
          <NsSetInput
            value={val}
            onChange={v => setValue(field.id, v)}
            placeholder={field.placeholder}
            className={inputCls}
            nsOnly={field.autocomplete === 'ns'}
          />
        </div>
      )
    }

    return (
      <div key={field.id} className={`${field.width ?? 'flex-1'} flex flex-col gap-0.5 min-w-0`}>
        <span className="text-[10px] text-text-disabled px-0.5">{field.label}</span>
        <input
          type="text"
          value={val}
          onChange={e => setValue(field.id, e.target.value)}
          placeholder={field.placeholder}
          className={inputCls}
        />
      </div>
    )
  }

  // ── Main layout ──────────────────────────────────────────────────────

  // For INSERT (has textarea): render inline fields + textarea side-by-side in a flex row
  // For all others: single horizontal row
  const inlineFields = cmd.fields.filter(f => f.type !== 'textarea')
  const textareaField = cmd.fields.find(f => f.type === 'textarea')

  return (
    <div className="px-3 py-2 border-b border-border bg-bg-surface/40 flex-shrink-0">
      <div className="flex items-end gap-2">
        {/* ── Command dropdown ── */}
        <div ref={dropdownRef} className="relative flex-shrink-0 self-end pb-0">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-text-disabled px-0.5">Command</span>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className={[
                'flex items-center gap-1.5 h-7 px-2.5 rounded border text-xs font-bold font-mono tracking-wide',
                'transition-colors whitespace-nowrap select-none',
                colors.badge,
              ].join(' ')}
            >
              {cmd.method}
              <ChevronDown
                className={`w-3 h-3 flex-shrink-0 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {dropdownOpen && (
            <div className="absolute top-full mt-1 left-0 z-50 w-60 rounded-md border border-border bg-bg-elevated shadow-2xl py-1 overflow-hidden">
              {COMMANDS.map(c => {
                const cc = COLORS[c.color]
                const active = c.id === cmdId
                return (
                  <button
                    key={c.id}
                    onClick={() => selectCmd(c.id)}
                    className={[
                      'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                      active ? 'bg-white/5' : 'hover:bg-white/4',
                    ].join(' ')}
                  >
                    <span className={`text-xs font-bold font-mono w-14 flex-shrink-0 ${cc.text}`}>
                      {c.method}
                    </span>
                    <span className={`text-xs ${active ? 'text-text-primary' : 'text-text-muted'}`}>
                      {c.label}
                    </span>
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Inline fields (non-textarea) ── */}
        {inlineFields.map(renderField)}

        {/* ── Textarea field (INSERT bins) ── */}
        {textareaField && renderField(textareaField)}

        {/* ── Action buttons ── */}
        <div className="flex items-center gap-1.5 flex-shrink-0 self-end">
          <button
            onClick={handleBuild}
            title="Generate AQL and paste into editor"
            className="h-7 px-2.5 text-xs font-medium rounded border border-border text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Wand2 className="w-3 h-3" />
            Build
          </button>
          <Button
            variant="primary"
            size="sm"
            icon={<Play className="w-3 h-3" />}
            loading={isLoading}
            onClick={handleBuildAndRun}
            title="Build AQL and run immediately"
          >
            Run
          </Button>
        </div>
      </div>

      {/* Divider between command bar and editor with a preview of what will be generated */}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] text-text-disabled font-mono flex-shrink-0">preview →</span>
        <span className="text-[10px] text-text-disabled font-mono truncate opacity-60">
          {buildStmt()}
        </span>
      </div>
    </div>
  )
}
