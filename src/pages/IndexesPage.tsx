import { useState } from 'react'
import { Plus, Layers } from 'lucide-react'
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

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Secondary Indexes</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {indexes?.length ?? 0} index{(indexes?.length ?? 0) !== 1 ? 'es' : ''}
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setCreateOpen(true)}
        >
          Create Index
        </Button>
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
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <IndexTable
            indexes={indexes}
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
