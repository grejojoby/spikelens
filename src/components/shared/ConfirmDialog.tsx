import { useEffect, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
  checkLabel?: string
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  loading,
  checkLabel,
}: ConfirmDialogProps) {
  const [checked, setChecked] = useState(false)

  // Reset checkbox every time the dialog opens
  useEffect(() => {
    if (open) setChecked(false)
  }, [open])

  const blocked = !!checkLabel && !checked

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="max-w-sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} disabled={blocked}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-error" />
        </div>
        <p className="text-sm text-text-muted leading-relaxed">{message}</p>
      </div>

      {checkLabel && (
        <label className="mt-4 flex items-center gap-2.5 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            className="w-4 h-4 rounded border border-border bg-surface accent-primary cursor-pointer"
          />
          <span className="text-xs text-text-muted group-hover:text-text-primary transition-colors">
            {checkLabel}
          </span>
        </label>
      )}
    </Modal>
  )
}
