import { Database, Search, Terminal, BarChart2, Layers, Plug } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import type { NavPage } from '@/types'

const NAV_ITEMS: { page: NavPage; icon: typeof Database; label: string }[] = [
  { page: 'connections', icon: Plug, label: 'Connections' },
  { page: 'browser', icon: Database, label: 'Browser' },
  { page: 'query', icon: Search, label: 'Query' },
  { page: 'aql', icon: Terminal, label: 'AQL' },
  { page: 'dashboard', icon: BarChart2, label: 'Dashboard' },
  { page: 'indexes', icon: Layers, label: 'Indexes' },
]

export default function Sidebar() {
  const { currentPage, setCurrentPage } = useAppStore()

  return (
    <aside className="w-14 flex-shrink-0 flex flex-col items-center py-4 gap-1 border-r border-border bg-bg-surface">
      {/* Logo */}
      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center mb-4">
        <Database className="w-4 h-4 text-white" />
      </div>

      {/* Nav items */}
      {NAV_ITEMS.map(({ page, icon: Icon, label }) => {
        const active = currentPage === page
        return (
          <button
            key={page}
            title={label}
            onClick={() => setCurrentPage(page)}
            className={[
              'w-10 h-10 flex items-center justify-center rounded-lg transition-colors relative group',
              active
                ? 'bg-accent/15 text-accent'
                : 'text-text-muted hover:text-text-primary hover:bg-white/5',
            ].join(' ')}
          >
            <Icon className="w-4.5 h-4.5" />
            {/* Tooltip */}
            <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-bg-elevated border border-border px-2 py-1 text-xs text-text-primary opacity-0 group-hover:opacity-100 transition-opacity z-50">
              {label}
            </span>
          </button>
        )
      })}
    </aside>
  )
}
