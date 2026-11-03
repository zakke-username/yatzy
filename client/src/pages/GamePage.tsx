import { useState } from "react";
import { Navigate, useParams } from "react-router";
import Scoreboard from "../components/Scoreboard.tsx";
import { useRoom } from "../hooks/useRoom.ts";
import { loadSession } from "../lib/session.ts";
import "./GamePage.css";

// No gameplay yet: the page shows the scoreboard, with disconnected players faded
function GamePage() {
  const roomId = useParams().roomId!.toUpperCase();
  const [session] = useState(() => loadSession(roomId));
  const { room, leave } = useRoom(session);

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
      <Scoreboard players={room.players} />

      <button type="button" className="leave" onClick={leave}>
        Leave game
      </button>
    </main>
  );
}

export default GamePage;
