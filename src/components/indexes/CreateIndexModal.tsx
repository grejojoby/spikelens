import { useState } from 'react'
import Modal from '@/components/shared/Modal'
import Input from '@/components/shared/Input'
import Button from '@/components/shared/Button'

interface CreateIndexModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (req: {
    namespace: string
    set: string
    name: string
    binName: string
    type: string
  }) => void
  loading?: boolean
}

const INDEX_TYPES = ['NUMERIC', 'STRING', 'GEO2DSPHERE'] as const

export default function CreateIndexModal({
  open,
  onClose,
  onSubmit,
  loading,
}: CreateIndexModalProps) {
  const [form, setForm] = useState({
    namespace: '',
    set: '',
    name: '',
    binName: '',
    type: 'STRING' as string,
  })

  const set = (key: keyof typeof form, value: string) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Secondary Index"
      description="Build a secondary index on a specific bin"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="idx-form" loading={loading}>
            Create Index
          </Button>
        </>
      }
    >
      <form id="idx-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Namespace"
          value={form.namespace}
          onChange={e => set('namespace', e.target.value)}
          required
        />
        <Input
          label="Set"
          value={form.set}
          onChange={e => set('set', e.target.value)}
          hint="Leave empty for namespace-wide index"
        />
        <Input
          label="Index Name"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          required
        />
        <Input
          label="Bin Name"
          value={form.binName}
          onChange={e => set('binName', e.target.value)}
          required
        />
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Index Type</label>
          <select
            value={form.type}
            onChange={e => set('type', e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-bg-surface px-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {INDEX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </form>
    </Modal>
  )
}
