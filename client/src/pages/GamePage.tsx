import { useState } from "react";
import { Navigate, useParams } from "react-router";
import Dice from "../components/Dice.tsx";
import Scoreboard from "../components/Scoreboard.tsx";
import { useRoom } from "../hooks/useRoom.ts";
import { ERROR_MESSAGES } from "../lib/api.ts";
import { socket } from "../lib/socket.ts";
import {
  DICE_COUNT,
  ROLLS_PER_TURN,
  type AckResponse,
} from "../../../shared/types.ts";
import "./GamePage.css";

const NONE_HELD = Array<boolean>(DICE_COUNT).fill(false);

// No scoring yet: the current player rolls the dice and ends their turn
function GamePage() {
  const roomId = useParams().roomId!.toUpperCase();
  const { session, room, leave } = useRoom(roomId);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [held, setHeld] = useState(NONE_HELD);

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

  async function handleEndTurn() {
    // The next turn starts with nothing held. This can't wait for currentPlayerId to change: in a one-player game it doesn't.
    if (await send(socket.emitWithAck("turn:end"))) setHeld(NONE_HELD);
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
        <p className="muted">Connecting to game...</p>
      </main>
    );
  }

  if (room.status === "waiting")
    return <Navigate to={`/lobby/${room.id}`} replace />;

  const isMyTurn = room.currentPlayerId === session.playerId;
  const hasRolled = room.rollsLeft < ROLLS_PER_TURN;

  return (
    <main className="page">
      <h1 className="game-title">Game in progress</h1>

      <section className="stack">
        <Dice
          // A roll always changes rollsLeft, so the new key rebuilds the dice and replays their landing spin
          key={room.rollsLeft}
          values={room.dice}
          held={held}
          rolling={rolling}
          // Boolean array: which dice were just rolled. For spin animation.
          landing={room.held.map((isHeld) => hasRolled && !isHeld)}
          // Dice are disabled if not your turn, haven't yet rolled, or no rolls left
          disabled={busy || !isMyTurn || !hasRolled || room.rollsLeft === 0}
          onToggle={toggleHeld}
        />
        <button
          type="button"
          className="button"
          // Roll button disabled if not your turn or no rolls left
          disabled={busy || !isMyTurn || room.rollsLeft === 0}
          onClick={handleRoll}
        >
          Roll ({room.rollsLeft} left)
        </button>
      </section>

      <Scoreboard
        players={room.players}
        currentPlayerId={room.currentPlayerId}
        potentialScores={hasRolled ? room.potentialScores : null}
      />

      <button
        type="button"
        className="button"
        disabled={busy || !isMyTurn}
        onClick={handleEndTurn}
      >
        End turn
      </button>
      {error && <p className="error">{error}</p>}

      <button type="button" className="leave" onClick={leave}>
        Leave game
      </button>
    </main>
  );
}

export default GamePage;
