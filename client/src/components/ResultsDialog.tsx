import { useEffect, useRef } from "react";
import type { PublicPlayer } from "../../../shared/types.ts";
import "./ResultsDialog.css";

type Props = {
  players: PublicPlayer[];
  /** The viewing player, marked "(you)" */
  playerId: string;
  onReturn: () => void;
};

// The final ranking, shown to every player once the game has finished
function ResultsDialog({ players, playerId, onReturn }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const ranked = players.toSorted((a, b) => b.total - a.total);

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="results-title"
      onCancel={(event) => {
        // Escape returns home too: closing the dialog would leave a game with nothing left to do
        event.preventDefault();
        onReturn();
      }}
    >
      <div className="results">
        <h2 id="results-title">Game over</h2>
        <table>
          <tbody>
            {ranked.map((player) => {
              // Ties share a place: 1, 1, 3
              const place =
                ranked.findIndex((p) => p.total === player.total) + 1;
              return (
                <tr key={player.id} data-winner={place === 1}>
                  <td>{place}.</td>
                  <th scope="row">
                    {player.name}
                    {player.id === playerId && (
                      <span className="muted"> (you)</span>
                    )}
                  </th>
                  <td>{player.total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button type="button" className="button" onClick={onReturn}>
          Return to home page
        </button>
      </div>
    </dialog>
  );
}

export default ResultsDialog;
