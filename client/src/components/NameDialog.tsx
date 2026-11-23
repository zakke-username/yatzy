import { useEffect, useRef, useState, type FormEvent } from "react";
import { MAX_NAME_LENGTH } from "../../../shared/types.ts";

type Props = {
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
};

function NameDialog({ onSubmit, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(() => sessionStorage.getItem("name") ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sessionStorage.setItem("name", name);
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
      className="card backdrop:bg-transparent"
      ref={dialogRef}
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        // Close dialog with esc
        event.preventDefault();
        onCancel();
      }}
    >
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <h2
          className="text-2xl font-bold text-center text-nowrap m-3"
          id="dialog-title"
        >
          Join game
        </h2>
        <input
          className="flex-1 border-gray-400 border-2 p-4 rounded-lg"
          placeholder="Enter your name"
          aria-label="Your name"
          autoComplete="nickname"
          required
          maxLength={MAX_NAME_LENGTH}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <div className="flex gap-6">
          <button type="submit" className="btn flex-1" disabled={busy}>
            Join
          </button>
          <button
            type="button"
            className="btn bg-red-500 flex-1"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default NameDialog;
