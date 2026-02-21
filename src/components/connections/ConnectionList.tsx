import { useState } from 'react'
import { Plus, Plug } from 'lucide-react'
import {
  useConnections,
  useCreateConnection,
  useUpdateConnection,
  useDeleteConnection,
  useTestConnection,
  useActivateConnection,
} from '@/hooks/useConnections'
import ConnectionCard from './ConnectionCard'
import ConnectionForm from './ConnectionForm'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Button from '@/components/shared/Button'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import type { ConnectionProfile } from '@/types'

export default function ConnectionList() {
  const { data: connections, isLoading } = useConnections()
  const createMut = useCreateConnection()
  const updateMut = useUpdateConnection()
  const deleteMut = useDeleteConnection()
  const testMut = useTestConnection()
  const activateMut = useActivateConnection()

  const [formOpen, setFormOpen] = useState(false)
  const [editConn, setEditConn] = useState<ConnectionProfile | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [activatingId, setActivatingId] = useState<string | null>(null)

  const handleTest = (id: string) => {
    setTestingId(id)
    testMut.mutate(id, { onSettled: () => setTestingId(null) })
  }

  const handleActivate = (id: string) => {
    setActivatingId(id)
    activateMut.mutate(id, { onSettled: () => setActivatingId(null) })
  }

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Connections</h2>
          <p className="text-xs text-text-muted mt-0.5">Manage your Aerospike cluster connections</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => { setEditConn(null); setFormOpen(true) }}
        >
          New Connection
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : !connections?.length ? (
        <EmptyState
          icon={Plug}
          title="No connections yet"
          description="Add your first Aerospike cluster connection to get started."
          action={
            <Button variant="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setFormOpen(true)}>
              Add Connection
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {connections.map(conn => (
            <ConnectionCard
              key={conn.id}
              connection={conn}
              activating={activatingId === conn.id}
              testing={testingId === conn.id}
              onActivate={() => handleActivate(conn.id)}
              onEdit={() => { setEditConn(conn); setFormOpen(true) }}
              onDelete={() => setDeleteId(conn.id)}
              onTest={() => handleTest(conn.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      <ConnectionForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditConn(null) }}
        initial={editConn ?? undefined}
        loading={createMut.isPending || updateMut.isPending}
        onSubmit={(profile) => {
          if (editConn) {
            updateMut.mutate({ ...profile, id: editConn.id, active: editConn.active }, {
              onSuccess: () => { setFormOpen(false); setEditConn(null) },
            })
          } else {
            createMut.mutate(profile, {
              onSuccess: () => setFormOpen(false),
            })
          }
        }}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteMut.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
        }}
        title="Delete Connection"
        message="Are you sure you want to remove this connection? This cannot be undone."
        loading={deleteMut.isPending}
      />
    </div>
  )
}
