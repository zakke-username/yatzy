import { useEffect, useState } from "react";
import notificationSoundUrl from "../assets/notification.mp3";
import Chat from "../components/Chat.tsx";
import Dice from "../components/Dice.tsx";
import ResultsDialog from "../components/ResultsDialog.tsx";
import Scoreboard from "../components/Scoreboard.tsx";
import TurnTimer from "../components/TurnTimer.tsx";
import { ERROR_MESSAGES } from "../lib/api.ts";
import { socket } from "../lib/socket.ts";
import {
  ROLLS_PER_TURN,
  type AckResponse,
  type PublicRoomState,
} from "../../../shared/types.ts";

const NOTIFICATION_SOUND = new Audio(notificationSoundUrl);
NOTIFICATION_SOUND.volume = 0.4;

type Props = {
  room: PublicRoomState;
  playerId: string; // you
  onLeave: () => void;
  onPlayAgain: () => void;
};

function Game({ room, playerId, onLeave, onPlayAgain }: Props) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(false);

  const playing = room.status === "game";
  const isMyTurn = playing && room.currentPlayerId === playerId;
  const hasRolled = room.rollsLeft < ROLLS_PER_TURN;
  const currentPlayer = room.players.find((p) => p.id === room.currentPlayerId);

  // Warn before closing
  useEffect(() => {
    if (!playing) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [playing]);

  // Turn notification sound
  useEffect(() => {
    if (isMyTurn) NOTIFICATION_SOUND.play().catch(() => {});
  }, [isMyTurn]);

  // Disables buttons until the server answers or the connection drops,
  // so a double click sends only one request
  async function send(request: Promise<AckResponse>) {
    setBusy(true);
    // Rejects if the connection drops before the server answers
    const response = await request.catch(() => undefined);
    setBusy(false);
    setError(response && !response.ok ? ERROR_MESSAGES[response.error] : "");
  }

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex h-12 items-center justify-between gap-4 border-b-2 border-black bg-white pl-5 pr-4 shadow-bar">
        {/* Turn info */}
        <div className="flex min-w-0 items-center gap-4">
          <h2
            className={`truncate font-bold md:text-xl ${isMyTurn ? "animate-pulse-text text-primary" : ""} ${currentPlayer?.connected ? "" : "text-red-600"}`}
          >
            {currentPlayer?.connected
              ? isMyTurn
                ? "Your turn!"
                : `${currentPlayer.name}'s turn`
              : `${currentPlayer?.name} has disconnected...`}
          </h2>
          {playing && (
            <TurnTimer key={room.turnEndsAt} endsAt={room.turnEndsAt} />
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn relative bg-white py-0.5 px-1"
            aria-label="Chat"
            title="Chat"
            onClick={() => {
              setChatOpen((chatOpen) => !chatOpen);
              setUnreadMessages(false);
            }}
          >
            💬
            {unreadMessages && (
              <span className="absolute -top-2 -left-2 flex size-5 animate-pulse items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                !
              </span>
            )}
          </button>
          <a
            className="btn bg-white py-0.5 px-1"
            href="https://en.wikipedia.org/wiki/Yatzy#Gameplay"
            target="_blank"
            rel="noreferrer"
            aria-label="Rules"
            title="Rules"
          >
            ❓
          </a>
          <button
            type="button"
            className="btn bg-white py-0.5 px-1"
            aria-label="Exit"
            title="Exit"
            onClick={() => {
              if (
                confirm(
                  "Are you sure you want to leave? You cannot rejoin this game.",
                )
              )
                onLeave();
            }}
          >
            ❌
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-4">
        <Scoreboard
          players={room.players}
          currentPlayerId={room.currentPlayerId}
          potentialScores={isMyTurn && hasRolled ? room.potentialScores : null}
          disabled={busy}
          // Scoring a category ends the turn
          onScore={(category) =>
            send(socket.emitWithAck("turn:end", { category }))
          }
        />

        <Dice
          // A new turnEndsAt remounts the dice, which releases held ones
          key={room.turnEndsAt}
          room={room}
          isMyTurn={isMyTurn}
          busy={busy}
          onRoll={(held) => send(socket.emitWithAck("turn:roll", { held }))}
        />
      </div>

      <Chat
        playerId={playerId}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onMessage={() => {
          if (!chatOpen) setUnreadMessages(true);
        }}
      />

      {/* GAME OVER: show results dialog */}
      {room.status === "finished" && (
        <ResultsDialog
          players={room.players}
          playerId={playerId}
          onPlayAgain={onPlayAgain}
          onReturn={onLeave}
        />
      )}

      {error && (
        <p className="fixed top-18 left-4 rounded-lg bg-danger/70 p-2 text-white">
          ⚠️ {error}
        </p>
      )}
    </main>
  );
}

export default Game;
