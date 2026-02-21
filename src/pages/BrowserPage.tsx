import { useState } from 'react'
import NamespaceTree from '@/components/browser/NamespaceTree'
import RecordTable from '@/components/browser/RecordTable'
import RecordInspector from '@/components/browser/RecordInspector'
import EmptyState from '@/components/shared/EmptyState'
import { Database } from 'lucide-react'
import type { RecordResponse } from '@/types'

export default function BrowserPage() {
  const [selectedNs, setSelectedNs] = useState('')
  const [selectedSet, setSelectedSet] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<RecordResponse | null>(null)

  const handleSelect = (ns: string, set: string) => {
    setSelectedNs(ns)
    setSelectedSet(set)
    setSelectedRecord(null)
  }

  return (
    <div className="flex h-full">
      {/* Namespace tree */}
      <div className="w-56 flex-shrink-0 border-r border-border overflow-y-auto">
        <NamespaceTree
          selectedNs={selectedNs}
          selectedSet={selectedSet}
          onSelect={handleSelect}
        />
      </div>

      {/* Record table */}
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {selectedNs && selectedSet ? (
          <RecordTable
            ns={selectedNs}
            set={selectedSet}
            onSelect={setSelectedRecord}
            selectedKey={selectedRecord?.key}
          />
        ) : (
          <EmptyState
            icon={Database}
            title="Select a set"
            description="Choose a namespace and set from the tree on the left to browse records."
          />
        )}
      </div>

      {/* Record inspector */}
      {selectedRecord && (
        <div className="w-72 flex-shrink-0 border-l border-border overflow-y-auto">
          <RecordInspector
            record={selectedRecord}
            ns={selectedNs}
            set={selectedSet}
            onClose={() => setSelectedRecord(null)}
          />
        </div>
      )}
    </div>
  )
}
