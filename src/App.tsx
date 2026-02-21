import { useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useAppStore } from '@/store/appStore'
import ConnectionsPage from '@/pages/ConnectionsPage'
import BrowserPage from '@/pages/BrowserPage'
import QueryPage from '@/pages/QueryPage'
import AQLPage from '@/pages/AQLPage'
import DashboardPage from '@/pages/DashboardPage'
import IndexesPage from '@/pages/IndexesPage'

function PageContent() {
  const { currentPage } = useAppStore()
  switch (currentPage) {
    case 'connections': return <ConnectionsPage />
    case 'browser':     return <BrowserPage />
    case 'query':       return <QueryPage />
    case 'aql':         return <AQLPage />
    case 'dashboard':   return <DashboardPage />
    case 'indexes':     return <IndexesPage />
    default:            return <ConnectionsPage />
  }
}

export default function App() {
  const { theme } = useAppStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <AppShell>
      <PageContent />
    </AppShell>
  )
}
