import { useEffect, useRef, useState, type FormEvent } from 'react'
import './NameDialog.css'

// The server enforces the same limit
const MAX_NAME_LENGTH = 20

type Props = {
  title: string
  submitLabel: string
  /** Throw an Error to show its message in the dialog */
  onSubmit: (name: string) => Promise<void>
  onCancel: () => void
}

function NameDialog({ title, submitLabel, onSubmit, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSubmit(name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        // Let the parent close the dialog (by unmounting it) when Escape is pressed
        event.preventDefault()
        onCancel()
      }}
    >
      <form onSubmit={handleSubmit}>
        <h2 id="dialog-title">{title}</h2>
        <input
          className="input"
          placeholder="Your name"
          aria-label="Your name"
          autoComplete="nickname"
          required
          maxLength={MAX_NAME_LENGTH}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="button button-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="button" disabled={busy}>
            {submitLabel}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default NameDialog
