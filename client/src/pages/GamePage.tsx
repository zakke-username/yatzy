import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router";
import notificationSoundUrl from "../assets/notification.mp3";
import Chat from "../components/Chat.tsx";
import Dice from "../components/Dice.tsx";
import ResultsDialog from "../components/ResultsDialog.tsx";
import Scoreboard from "../components/Scoreboard.tsx";
import { useRoom } from "../hooks/useRoom.ts";
import { ERROR_MESSAGES } from "../lib/api.ts";
import { socket } from "../lib/socket.ts";
import {
  DICE_COUNT,
  ROLLS_PER_TURN,
  type AckResponse,
  type Category,
} from "../../../shared/types.ts";
import "./GamePage.css";

const NONE_HELD = Array<boolean>(DICE_COUNT).fill(false);
const NOTIFICATION_SOUND = new Audio(notificationSoundUrl);

// The current player rolls the dice, then picks a category to score, which ends their turn
function GamePage() {
  const roomId = useParams().roomId!.toUpperCase();
  const { session, room, leave } = useRoom(roomId);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [held, setHeld] = useState(NONE_HELD);

  // Warn before closing
  const playing = room?.status === "playing";
  useEffect(() => {
    if (!playing) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  });

  // Turn notification sound
  const isMyTurn = !!session && room?.currentPlayerId === session.playerId;
  useEffect(() => {
    if (isMyTurn) NOTIFICATION_SOUND.play().catch(() => {});
  }, [isMyTurn]);

  function toggleHeld(index: number) {
    setHeld(held.map((isHeld, i) => (i === index ? !isHeld : isHeld)));
  }

  // Disables the buttons until the server answers or the connection drops, so a double click sends only one request
  async function send(request: Promise<AckResponse>) {
    setBusy(true);
    // Rejects if the connection drops before the server answers
    const response = await request.catch(() => undefined);
    setBusy(false);
    setError(response && !response.ok ? ERROR_MESSAGES[response.error] : "");
    return response?.ok;
  }

  async function handleRoll() {
    setRolling(true);
    await send(socket.emitWithAck("turn:roll", { held }));
    setRolling(false);
  }

  async function handleScore(category: Category) {
    // The next turn starts with nothing held. This can't wait for currentPlayerId to change: in a one-player game it doesn't.
    if (await send(socket.emitWithAck("turn:end", { category })))
      setHeld(NONE_HELD);
  }

  // No session = player not in this game, redirect to home page
  if (!session) {
    return (
      <Navigate
        to="/"
        replace
        state={{ message: ERROR_MESSAGES.GAME_STARTED }}
      />
    );
  }

  if (!room) {
    return (
      <main className="page">
        <p>
          <b>Connecting to game...</b>
        </p>
      </main>
    );
  }

  if (room.status === "waiting")
    return <Navigate to={`/lobby/${room.id}`} replace />;

  const finished = room.status === "finished";
  const hasRolled = room.rollsLeft < ROLLS_PER_TURN;
  // const currentPlayer = room.players.find((p) => p.id === room.currentPlayerId);

  return (
    <main>
      <div className="menu-buttons">
        <a
          className="button small-button"
          href="https://en.wikipedia.org/wiki/Yatzy#Gameplay"
          target="_blank"
          rel="noreferrer"
        >
          ❓
        </a>
        <button
          type="button"
          className="button small-button"
          aria-label="Exit"
          title="Exit"
          onClick={leave}
        >
          ❌
        </button>
      </div>
      <div className="game">
        <Scoreboard
          players={room.players}
          currentPlayerId={room.currentPlayerId}
          isMyTurn={isMyTurn}
          potentialScores={hasRolled ? room.potentialScores : null}
          disabled={busy || !isMyTurn}
          onScore={handleScore}
        />

        <div className="stack side-panels">
          <div className="container controls">
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
                className="button"
                // Roll button disabled if not your turn or no rolls left
                disabled={busy || !isMyTurn || room.rollsLeft === 0}
                onClick={handleRoll}
              >
                Roll ({room.rollsLeft}/3)
              </button>
            )}
          </div>
          <Chat playerId={session.playerId} />
        </div>

        {finished && (
          <ResultsDialog
            players={room.players}
            playerId={session.playerId}
            onReturn={leave}
          />
        )}

        {error && <div className="error">⚠️ {error}</div>}
      </div>
    </main>
  );
}

export default GamePage;
