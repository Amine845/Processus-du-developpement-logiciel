import React, { useEffect, useRef } from 'react'
import './ConfirmDialog.css'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Supprimer',
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}) => {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby="confirm-dialog-title"
      // Échap : on laisse React décider (impossible pendant l'appel réseau).
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onCancel()
      }}
      // Clic sur le fond (le dialog lui-même, sans padding) : annuler.
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel()
      }}
    >
      <div className="confirm-dialog-body">
        <h3 id="confirm-dialog-title" className="confirm-dialog-title">
          {title}
        </h3>
        <p className="confirm-dialog-message">{message}</p>
        {error && (
          <p className="confirm-dialog-error" role="alert">
            {error}
          </p>
        )}
        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="confirm-dialog-cancel"
            onClick={onCancel}
            disabled={busy}
            autoFocus
          >
            Annuler
          </button>
          <button
            type="button"
            className="confirm-dialog-confirm"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Suppression…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
