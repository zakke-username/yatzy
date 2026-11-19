import { useEffect, useRef } from "react";
import fanfareSoundUrl from "../assets/fanfare.mp3";
import type { PublicPlayer } from "../../../shared/types.ts";
import styles from "./ResultsDialog.module.css";

const FANFARE_SOUND = new Audio(fanfareSoundUrl);
FANFARE_SOUND.volume = 0.6;

type Props = {
  players: PublicPlayer[];
  playerId: string; // you
  onPlayAgain: () => void;
  onReturn: () => void;
};

function ResultsDialog({ players, playerId, onPlayAgain, onReturn }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    FANFARE_SOUND.play().catch(() => {});
  }, []);

  const ranked = players.toSorted((a, b) => b.total - a.total);

  return (
    <dialog
      ref={dialogRef}
      className={styles.results}
      aria-labelledby="results-title"
      onCancel={(event) => {
        event.preventDefault();
        onReturn();
      }}
    >
      <h2 id="results-title">Game over!</h2>
      <table>
        <tbody>
          {ranked.map((player) => {
            const place = ranked.findIndex((p) => p.total === player.total) + 1;
            return (
              <tr key={player.id}>
                <td>{place}.</td>
                <th scope="row">
                  {place === 1 && <>🥇 </>}
                  {place === 2 && <>🥈 </>}
                  {place === 3 && <>🥉 </>}
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
      <button type="button" className="button" onClick={onPlayAgain}>
        Play again
      </button>
      <button
        type="button"
        className={`button ${styles.return}`}
        onClick={onReturn}
      >
        Exit to main menu
      </button>
    </dialog>
  );
}

export default ResultsDialog;
