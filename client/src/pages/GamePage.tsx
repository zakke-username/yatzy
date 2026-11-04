import { useState } from "react";
import { Navigate, useParams } from "react-router";
import Scoreboard from "../components/Scoreboard.tsx";
import { useRoom } from "../hooks/useRoom.ts";
import { ERROR_MESSAGES } from "../lib/api.ts";
import { loadSession } from "../lib/session.ts";
import "./GamePage.css";

// No dice or scoring yet: the page shows the scoreboard and lets the current player end their turn
function GamePage() {
  const roomId = useParams().roomId!.toUpperCase();
  const [session] = useState(() => loadSession(roomId));
  const { room, leave, endTurn } = useRoom(session);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleEndTurn() {
    // Disables the "end turn" button until the server answers or the connection drops: so a double click sends only one request
    setBusy(true);
    const response = await endTurn();
    setBusy(false);
    setError(response && !response.ok ? ERROR_MESSAGES[response.error] : "");
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

  return (
    <main className="page">
      <h1 className="game-title">Game in progress</h1>
      <Scoreboard
        players={room.players}
        currentPlayerId={room.currentPlayerId}
      />

      <button
        type="button"
        className="button"
        disabled={busy || room.currentPlayerId !== session.playerId}
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
