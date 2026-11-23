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
    <main className="flex min-h-dvh flex-col gap-4">
      <header className="sticky top-0 z-10 h-12 bg-white border-b-2 border-black flex justify-between items-center px-2 shadow-bar">
        <a
          className="btn bg-white text-xs p-1"
          href="https://en.wikipedia.org/wiki/Yatzy#Gameplay"
          target="_blank"
          rel="noreferrer"
        >
          ❓
        </a>
        <div className="flex flex-1 justify-between md:justify-center items-center gap-4 min-w-0">
          <h2
            className={`truncate md:text-xl font-bold pl-4 ${isMyTurn && "text-primary"} ${!currentPlayer?.connected && "text-red-600"}`}
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
        <button
          type="button"
          className="btn bg-white text-xs p-1"
          aria-label="Exit"
          title="Exit"
          onClick={onLeave}
        >
          ❌
        </button>
      </header>

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

      {/* mt-16: on narrow screens the chat button above the footer would cover the scoreboard's last rows */}
      <footer className="sticky bottom-0 z-10 mt-16 md:mt-0 bg-white border-t-2 border-black flex justify-center items-center p-3 shadow-bar">
        <Dice
          // A new turnEndsAt remounts the dice, which releases held ones
          key={room.turnEndsAt}
          room={room}
          isMyTurn={isMyTurn}
          busy={busy}
          onRoll={(held) => send(socket.emitWithAck("turn:roll", { held }))}
        />
        {/* Open chat: just above the footer, on the right */}
        <button
          type="button"
          className={`btn absolute right-4 bottom-full mb-4 bg-white p-1 text-3xl ${chatOpen && "hidden"}`}
          aria-label="Chat"
          title="Chat"
          onClick={() => {
            setChatOpen(true);
            setUnreadMessages(false);
          }}
        >
          💬
          {unreadMessages && (
            <span className="absolute -top-3 -left-3 flex size-7 items-center justify-center rounded-full bg-red-600 text-base font-bold text-white">
              !
            </span>
          )}
        </button>
      </footer>
      {error && (
        <div className="fixed top-16 left-4 bg-danger/75 text-white p-2 rounded-lg">
          ⚠️ {error}
        </div>
      )}
    </main>
  );
}

export default Game;
