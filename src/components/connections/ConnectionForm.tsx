import { useState, useEffect } from 'react'
import Modal from '@/components/shared/Modal'
import Input from '@/components/shared/Input'
import Button from '@/components/shared/Button'
import type { ConnectionProfile } from '@/types'

interface ConnectionFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (profile: Omit<ConnectionProfile, 'id' | 'active'>) => void
  initial?: Partial<ConnectionProfile>
  loading?: boolean
}

const DEFAULT: Omit<ConnectionProfile, 'id' | 'active'> = {
  name: '',
  host: 'localhost',
  port: 3000,
  user: '',
  password: '',
  tlsEnable: false,
}

export default function ConnectionForm({
  open,
  onClose,
  onSubmit,
  initial,
  loading,
}: ConnectionFormProps) {
  const [form, setForm] = useState({ ...DEFAULT })

  useEffect(() => {
    if (open) {
      setForm({ ...DEFAULT, ...initial })
    }
  }, [open, initial])

  const set = (key: keyof typeof form, value: string | boolean | number) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id ? 'Edit Connection' : 'New Connection'}
      description="Configure Aerospike cluster connection details"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="conn-form" loading={loading}>
            {initial?.id ? 'Update' : 'Add Connection'}
          </Button>
        </>
      }
    >
      <form id="conn-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="My Cluster"
          required
        />
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input
              label="Host"
              value={form.host}
              onChange={e => set('host', e.target.value)}
              placeholder="localhost"
              required
            />
          </div>
          <Input
            label="Port"
            type="number"
            value={String(form.port)}
            onChange={e => set('port', parseInt(e.target.value) || 3000)}
            placeholder="3000"
            required
          />
        </div>
        <Input
          label="Username"
          value={form.user ?? ''}
          onChange={e => set('user', e.target.value)}
          placeholder="Optional"
          autoComplete="off"
        />
        <Input
          label="Password"
          type="password"
          value={form.password ?? ''}
          onChange={e => set('password', e.target.value)}
          placeholder="Optional"
          autoComplete="new-password"
        />
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.tlsEnable}
            onChange={e => set('tlsEnable', e.target.checked)}
            className="w-4 h-4 rounded border-border accent-accent"
          />
          <span className="text-sm text-text-muted">Enable TLS</span>
        </label>
      </form>
    </Modal>
  )
}
