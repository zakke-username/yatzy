import { useEffect, useRef } from "react";
import fanfareSoundUrl from "../assets/fanfare.mp3";
import type { PublicPlayer } from "../../../shared/types.ts";

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
      className="card open:flex flex-col items-center gap-8 backdrop:bg-black/60"
      aria-labelledby="results-title"
      onCancel={(event) => {
        event.preventDefault();
        onReturn();
      }}
    >
      <h2 className="text-2xl font-bold mt-4" id="results-title">
        Game over!
      </h2>
      <table className="w-full">
        <tbody>
          {ranked.map((player) => {
            const place = ranked.findIndex((p) => p.total === player.total) + 1;
            return (
              <tr
                key={player.id}
                className="*:border-b *:border-gray-300 *:p-4"
              >
                <td>{place}.</td>
                {/* The names take the space that's left. Your own is bold */}
                <th
                  className={`w-full text-left text-nowrap ${player.id === playerId ? "font-bold" : "font-normal"}`}
                  scope="row"
                >
                  {place === 1 && <>🥇 </>}
                  {place === 2 && <>🥈 </>}
                  {place === 3 && <>🥉 </>}
                  {player.name}
                </th>
                <td className="text-right font-semibold">{player.total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-col gap-4 w-full">
        <button type="button" className="btn" onClick={onPlayAgain}>
          Play again
        </button>
        <button type="button" className="btn bg-danger" onClick={onReturn}>
          Exit to main menu
        </button>
      </div>
    </dialog>
  );
}

export default ResultsDialog;
