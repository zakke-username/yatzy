import { useState } from "react";
import { Navigate, useParams } from "react-router";
import Dice from "../components/Dice.tsx";
import Scoreboard from "../components/Scoreboard.tsx";
import { useRoom } from "../hooks/useRoom.ts";
import { ERROR_MESSAGES } from "../lib/api.ts";
import { loadSession } from "../lib/session.ts";
import { DICE_COUNT, ROLLS_PER_TURN } from "../../../shared/types.ts";
import "./GamePage.css";

const NONE_HELD = Array<boolean>(DICE_COUNT).fill(false);

// No scoring yet: the current player rolls the dice and ends their turn
function GamePage() {
  const roomId = useParams().roomId!.toUpperCase();
  const [session] = useState(() => loadSession(roomId));
  const { room, leave, roll, endTurn } = useRoom(session);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [held, setHeld] = useState(NONE_HELD);

  function toggleHeld(index: number) {
    setHeld(held.map((isHeld, i) => (i === index ? !isHeld : isHeld)));
  }

  async function handleRoll() {
    // Disables the buttons until the server answers or the connection drops: so a double click sends only one request
    setBusy(true);
    const response = await roll(held);
    setBusy(false);
    setError(response && !response.ok ? ERROR_MESSAGES[response.error] : "");
  }

  async function handleEndTurn() {
    setBusy(true);
    const response = await endTurn();
    setBusy(false);
    setError(response && !response.ok ? ERROR_MESSAGES[response.error] : "");

    // The next turn starts with nothing held. This can't wait for currentPlayerId to change: in a one-player game it doesn't.
    if (response?.ok) setHeld(NONE_HELD);
  }

  // Only the lobby page hands out seats, and it refuses new ones once the game has started
  if (!session) return <Navigate to={`/lobby/${roomId}`} replace />;

  if (!room) {
    return (
      <main className="page">
        <p className="muted">Connecting…</p>
      </main>
    );
  }

  if (room.status === "waiting")
    return <Navigate to={`/lobby/${room.id}`} replace />;

  const canAct = !busy && room.currentPlayerId === session.playerId;
  const canRoll = canAct && room.rollsLeft > 0;
  // A turn's starting dice are rerolled by its first roll, so they can't be held
  const hasRolled = room.rollsLeft < ROLLS_PER_TURN;

  return (
    <main className="page">
      <h1 className="game-title">Game in progress</h1>

      <section className="stack">
        <Dice
          values={room.dice}
          held={held}
          disabled={!canRoll || !hasRolled}
          onToggle={toggleHeld}
        />
        <button
          type="button"
          className="button"
          disabled={!canRoll}
          onClick={handleRoll}
        >
          Roll ({room.rollsLeft} left)
        </button>
      </section>

      <Scoreboard
        players={room.players}
        currentPlayerId={room.currentPlayerId}
      />

      <button
        type="button"
        className="button"
        disabled={!canAct}
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
