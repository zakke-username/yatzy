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
import styles from "./Game.module.css";

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
    <main className={styles.page} data-players={room.players.length}>
      <header>
        <a
          className={`button ${styles.small}`}
          href="https://en.wikipedia.org/wiki/Yatzy#Gameplay"
          target="_blank"
          rel="noreferrer"
        >
          ❓
        </a>
        <div className={styles["turn-info"]}>
          <h2
            className={styles.turn}
            data-my-turn={isMyTurn}
            data-connected={currentPlayer?.connected}
          >
            {currentPlayer?.connected
              ? isMyTurn
                ? "Your turn!"
                : `${currentPlayer.name}'s turn`
              : `${currentPlayer?.name} has disconnected: kicking soon...`}
          </h2>
          {playing && (
            <TurnTimer key={room.turnEndsAt} endsAt={room.turnEndsAt} />
          )}
        </div>
        <button
          type="button"
          className={`button ${styles.small}`}
          aria-label="Exit"
          title="Exit"
          onClick={onLeave}
        >
          ❌
        </button>
      </header>
      <div className={styles.game}>
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
          className={styles.chat}
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
      </div>
      <footer>
        <Dice
          // A new turnEndsAt remounts the dice, which releases held ones
          key={room.turnEndsAt}
          room={room}
          isMyTurn={isMyTurn}
          busy={busy}
          onRoll={(held) => send(socket.emitWithAck("turn:roll", { held }))}
        />
        {/* Open chat */}
        <button
          type="button"
          className={`button ${styles.small} ${styles["chat-button"]}`}
          aria-label="Chat"
          data-unread={unreadMessages}
          title="Chat"
          onClick={() => {
            setChatOpen(true);
            setUnreadMessages(false);
          }}
        >
          💬
        </button>
      </footer>
      {error && <div className="error">⚠️ {error}</div>}
    </main>
  );
}

export default Game;
