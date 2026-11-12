import { useEffect, useRef } from "react";
import "./RulesDialog.css";

type Props = {
  onClose: () => void;
};

function RulesDialog({ onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="dialog rules"
      aria-labelledby="rules-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <h2 id="rules-title">How to play Yatzy</h2>
      <div className="rules-body">
        <p>
          The point is to roll various combinations from the dice. And get the
          biggest score.
        </p>
        <ol>
          <li>Roll the dice</li>
          <li>Lock the dice you want to keep</li>
          <li>Roll again (up to three times total)</li>
          <li>Select a score from the board</li>
        </ol>
      </div>
      <button type="button" className="button" onClick={onClose}>
        Alright
      </button>
    </dialog>
  );
}

export default RulesDialog;
