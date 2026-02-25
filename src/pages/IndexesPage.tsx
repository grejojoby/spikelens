import { useState, useMemo } from 'react'
import { Plus, Layers, Search } from 'lucide-react'
import IndexTable from '@/components/indexes/IndexTable'
import CreateIndexModal from '@/components/indexes/CreateIndexModal'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Button from '@/components/shared/Button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { useIndexes, useCreateIndex, useDropIndex } from '@/hooks/useIndexes'
import type { SecondaryIndex } from '@/types'

export default function IndexesPage() {
  const { data: indexes, isLoading } = useIndexes()
  const createMut = useCreateIndex()
  const dropMut = useDropIndex()

  const [createOpen, setCreateOpen] = useState(false)
  const [dropTarget, setDropTarget] = useState<SecondaryIndex | null>(null)
  const [query, setQuery] = useState('')

  const filteredIndexes = useMemo(() => {
    if (!query.trim()) return indexes ?? []
    const q = query.toLowerCase()
    return (indexes ?? []).filter(idx =>
      idx.name.toLowerCase().includes(q) ||
      idx.namespace.toLowerCase().includes(q) ||
      (idx.set && idx.set.toLowerCase().includes(q)) ||
      idx.binName.toLowerCase().includes(q)
    )
  }, [indexes, query])

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Secondary Indexes</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {filteredIndexes.length}{query.trim() ? ` of ${indexes?.length ?? 0}` : ''} index{filteredIndexes.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-disabled pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search indexes…"
              className="h-8 pl-8 pr-3 rounded-lg border border-border bg-bg-surface text-xs text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-1 focus:ring-accent/50 w-52"
            />
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setCreateOpen(true)}
          >
            Create Index
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : !indexes?.length ? (
        <EmptyState
          icon={Layers}
          title="No indexes"
          description="Create a secondary index to enable equality and range queries on bin values."
          action={
            <Button variant="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setCreateOpen(true)}>
              Create Index
            </Button>
          }
        />
      ) : !filteredIndexes.length ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description={`No indexes match "${query}". Try searching by name, namespace, set, or bin.`}
        />
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <IndexTable
            indexes={filteredIndexes}
            onDrop={setDropTarget}
            droppingName={dropMut.isPending ? dropTarget?.name : undefined}
          />
        </div>
      )}

      <CreateIndexModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        loading={createMut.isPending}
        onSubmit={(req) => {
          createMut.mutate(req as Omit<SecondaryIndex, 'state'>, {
            onSuccess: () => setCreateOpen(false),
          })
        }}
      />

      <ConfirmDialog
        open={!!dropTarget}
        onClose={() => setDropTarget(null)}
        onConfirm={() => {
          if (dropTarget) {
            dropMut.mutate(
              { namespace: dropTarget.namespace, name: dropTarget.name },
              { onSuccess: () => setDropTarget(null) }
            )
          }
        }}
        title="Drop Index"
        message={`Are you sure you want to drop index "${dropTarget?.name}"? This action is permanent and cannot be undone.`}
        confirmLabel="Drop Index"
        loading={dropMut.isPending}
        checkLabel="I understand this index will be permanently deleted"
      />
    </div>
  )
}
