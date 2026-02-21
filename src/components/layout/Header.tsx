import { Sun, Moon } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useConnections } from '@/hooks/useConnections'
import StatusDot from '@/components/shared/StatusDot'

const PAGE_TITLES: Record<string, string> = {
  connections: 'Connections',
  browser: 'Data Browser',
  query: 'Query Builder',
  aql: 'AQL Console',
  dashboard: 'Cluster Dashboard',
  indexes: 'Index Manager',
}

export default function Header() {
  const { currentPage, theme, setTheme, activeConnectionId } = useAppStore()
  const { data: connections } = useConnections()
  const activeConn = connections?.find(c => c.id === activeConnectionId)

  return (
    <header className="h-12 flex-shrink-0 flex items-center justify-between px-4 border-b border-border bg-bg-surface">
      <h1 className="text-sm font-semibold text-text-primary">
        {PAGE_TITLES[currentPage] ?? currentPage}
      </h1>

      <div className="flex items-center gap-3">
        {/* Active connection indicator */}
        {activeConn ? (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <StatusDot active size="sm" />
            <span className="font-mono">{activeConn.name}</span>
            <span className="text-text-disabled">
              {activeConn.host}:{activeConn.port}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <StatusDot active={false} size="sm" />
            <span>No connection</span>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  )
}
