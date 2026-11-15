import { useEffect, useRef } from "react";
import fanfareSoundUrl from "../assets/fanfare.mp3";
import type { PublicPlayer } from "../../../shared/types.ts";
import styles from "./ResultsDialog.module.css";

const FANFARE_SOUND = new Audio(fanfareSoundUrl);

type Props = {
  players: PublicPlayer[];
  playerId: string; // you
  onReturn: () => void;
};

function ResultsDialog({ players, playerId, onReturn }: Props) {
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
            // Ties share a place: 1, 1, 3
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
      <button type="button" className="button" onClick={onReturn}>
        Back to main menu
      </button>
    </dialog>
  );
}

export default ResultsDialog;
