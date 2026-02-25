import { useState } from 'react'
import AQLCommandBar from '@/components/aql/AQLCommandBar'
import AQLEditor from '@/components/aql/AQLEditor'
import AQLResultPane from '@/components/aql/AQLResultPane'
import AQLHistory from '@/components/aql/AQLHistory'
import AQLCheatSheet from '@/components/aql/AQLCheatSheet'
import { useAQL } from '@/hooks/useAQL'
import { useNamespaces } from '@/hooks/useRecords'

const INITIAL_STMT = 'SELECT * FROM namespace.set LIMIT 10'

export default function AQLPage() {
  const [stmt, setStmt] = useState(INITIAL_STMT)
  const { execute, result, isLoading, history } = useAQL()
  const { data: nsData } = useNamespaces()
  const namespaces: string[] = (nsData ?? []).map((n: { name: string }) => n.name)

  const handleExecute = () => {
    if (stmt.trim()) execute(stmt.trim())
  }

  const handleExecuteStmt = (s: string) => {
    if (s.trim()) execute(s.trim())
  }

  return (
    <div className="flex h-full">
      {/* Left sidebar: history + cheatsheet */}
      <div className="w-56 flex-shrink-0 border-r border-border flex flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-border text-xs font-medium text-text-muted">
          History
        </div>
        <div className="flex-1 overflow-y-auto">
          <AQLHistory history={history} onSelect={setStmt} />
        </div>
        <AQLCheatSheet onSelect={setStmt} />
      </div>

      {/* Main: command bar + editor + results */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Command builder */}
        <AQLCommandBar
          onBuild={setStmt}
          onExecute={handleExecuteStmt}
          isLoading={isLoading}
        />

        {/* Editor */}
        <div className="h-40 flex-shrink-0 border-b border-border">
          <AQLEditor
            value={stmt}
            onChange={setStmt}
            onExecute={handleExecute}
            isLoading={isLoading}
            namespaces={namespaces}
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-hidden">
          <AQLResultPane result={result} />
        </div>
      </div>
    </div>
  )
}
