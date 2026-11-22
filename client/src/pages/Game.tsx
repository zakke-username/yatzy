import { useEffect, useState } from "react";
import rollSoundUrl from "../assets/dice-roll.wav";
import notificationSoundUrl from "../assets/notification.mp3";
import Chat from "../components/Chat.tsx";
import Dice from "../components/Dice.tsx";
import ResultsDialog from "../components/ResultsDialog.tsx";
import Scoreboard from "../components/Scoreboard.tsx";
import TurnTimer from "../components/TurnTimer.tsx";
import { ERROR_MESSAGES } from "../lib/api.ts";
import { socket } from "../lib/socket.ts";
import {
  DICE_COUNT,
  ROLLS_PER_TURN,
  type AckResponse,
  type Category,
  type PublicRoomState,
} from "../../../shared/types.ts";
import styles from "./Game.module.css";

const NONE_HELD = Array<boolean>(DICE_COUNT).fill(false);

// Sounds
const NOTIFICATION_SOUND = new Audio(notificationSoundUrl);
NOTIFICATION_SOUND.volume = 0.4;
const ROLL_SOUND = new Audio(rollSoundUrl);
ROLL_SOUND.volume = 0.5;

type Props = {
  room: PublicRoomState;
  playerId: string; // you
  onLeave: () => void;
  onPlayAgain: () => void;
};

function Game({ room, playerId, onLeave, onPlayAgain }: Props) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [held, setHeld] = useState(NONE_HELD);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(false);

  const playing = room.status === "playing";
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

  // Roll sound for other players (the roller's plays on click)
  useEffect(() => {
    if (!isMyTurn && room.rollsLeft < ROLLS_PER_TURN) {
      ROLL_SOUND.currentTime = 0;
      ROLL_SOUND.play().catch(() => {});
    }
  }, [room.rollsLeft, isMyTurn]);

  // A new turn (new turnEndsAt) releases the held dice
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => setHeld(NONE_HELD), [room.turnEndsAt]);

  // Flag unread messages
  useEffect(() => {
    if (chatOpen) return;
    const onMessage = () => setUnreadMessages(true);
    socket.on("chat:message", onMessage);
    return () => {
      socket.off("chat:message", onMessage);
    };
  }, [chatOpen]);

  // Hold dice
  function toggleHeld(index: number) {
    setHeld(held.map((isHeld, i) => (i === index ? !isHeld : isHeld)));
  }

  // Disables buttons until the server answers or the connection drops,
  // so a double click sends only one request
  async function send(request: Promise<AckResponse>) {
    setBusy(true);
    // Rejects if the connection drops before the server answers
    const response = await request.catch(() => undefined);
    setBusy(false);
    setError(response && !response.ok ? ERROR_MESSAGES[response.error] : "");
  }

  // Roll dice
  // rolling = spin dice at constant pace until server responds ("loading")
  async function handleRoll() {
    // Play sound for current player only
    ROLL_SOUND.currentTime = 0;
    ROLL_SOUND.play().catch(() => {});
    setRolling(true);
    await send(socket.emitWithAck("turn:roll", { held }));
    setRolling(false);
  }

  // Score a category, which ends the turn
  function handleScore(category: Category) {
    send(socket.emitWithAck("turn:end", { category }));
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
          onScore={handleScore}
        />
        <Chat
          className={styles.chat}
          playerId={playerId}
          open={chatOpen}
          onClose={() => setChatOpen(false)}
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
        <div className={styles.controls}>
          <Dice
            // A roll always changes rollsLeft, so the new key rebuilds the dice and replays their landing spin
            key={room.rollsLeft}
            values={room.dice}
            held={held}
            rolling={rolling} // Constant "loading" spin for current turn player, stops when server responds
            landing={room.held.map((isHeld) => hasRolled && !isHeld)} // Which dice were just rolled: short spin for all players
            disabled={busy || !isMyTurn || !hasRolled || room.rollsLeft === 0}
            onToggle={toggleHeld}
          />
          {isMyTurn && (
            <button
              type="button"
              className={`button ${styles["roll-button"]}`}
              disabled={
                busy || room.rollsLeft === 0 || held.every((isHeld) => isHeld)
              }
              data-highlight={!hasRolled}
              onClick={handleRoll}
            >
              Roll ({room.rollsLeft}/{ROLLS_PER_TURN})
            </button>
          )}
        </div>
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
