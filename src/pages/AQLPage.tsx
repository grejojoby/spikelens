import { useState } from 'react'
import AQLEditor from '@/components/aql/AQLEditor'
import AQLResultPane from '@/components/aql/AQLResultPane'
import AQLHistory from '@/components/aql/AQLHistory'
import AQLCheatSheet from '@/components/aql/AQLCheatSheet'
import { useAQL } from '@/hooks/useAQL'

const INITIAL_STMT = 'SELECT * FROM namespace.set LIMIT 10'

export default function AQLPage() {
  const [stmt, setStmt] = useState(INITIAL_STMT)
  const { execute, result, isLoading, history } = useAQL()

  const handleExecute = () => {
    if (stmt.trim()) execute(stmt.trim())
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

      {/* Main: editor + results */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Editor (top half) */}
        <div className="h-48 flex-shrink-0 border-b border-border">
          <AQLEditor
            value={stmt}
            onChange={setStmt}
            onExecute={handleExecute}
            isLoading={isLoading}
          />
        </div>

        {/* Results (bottom) */}
        <div className="flex-1 overflow-hidden">
          <AQLResultPane result={result} />
        </div>
      </div>
    </div>
  )
}
