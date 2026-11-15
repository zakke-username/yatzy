import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./NameDialog.module.css";

const MAX_NAME_LENGTH = 20;

type Props = {
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
};

function NameDialog({ onSubmit, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        // Close dialog with esc
        event.preventDefault();
        onCancel();
      }}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 id="dialog-title">Join game</h2>
        <input
          placeholder="Enter your name"
          aria-label="Your name"
          autoComplete="nickname"
          required
          maxLength={MAX_NAME_LENGTH}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button
          type="button"
          className={`button ${styles.cancel}`}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className="button" disabled={busy}>
          Join
        </button>
      </form>
    </dialog>
  );
}

export default NameDialog;
