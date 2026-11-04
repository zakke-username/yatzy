import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import LobbyInvite from "../components/LobbyInvite.tsx";
import NameDialog from "../components/NameDialog.tsx";
import PlayerList from "../components/PlayerList.tsx";
import { useRoom } from "../hooks/useRoom.ts";
import { ERROR_MESSAGES, joinRoom } from "../lib/api.ts";
import { loadSession } from "../lib/session.ts";
import "./LobbyPage.css";

function LobbyPage() {
  const roomId = useParams().roomId!.toUpperCase();
  const navigate = useNavigate();
  const [session, setSession] = useState(() => loadSession(roomId));
  const { room, leave, start } = useRoom(session);
  const [error, setError] = useState("");

  async function startGame() {
    // On success the new status arrives in room:state, which sends everyone to the game page
    const response = await start();
    if (response && !response.ok) setError(ERROR_MESSAGES[response.error]);
  }

  // No token for this room in this tab yet, so join as a new player.
  // The server refuses this once the game has started.
  if (!session) {
    return (
      <NameDialog
        title="Join game"
        submitLabel="Join"
        onSubmit={async (name) => setSession(await joinRoom(roomId, name))}
        onCancel={() => navigate("/")}
      />
    );
  }

  if (!room) {
    return (
      <main className="page">
        <p className="muted">Connecting…</p>
      </main>
    );
  }

  if (room.status !== "waiting")
    return <Navigate to={`/game/${room.id}`} replace />;

  return (
    <main className="page">
      <LobbyInvite roomId={room.id} />
      <PlayerList room={room} playerId={session.playerId} />

      {room.hostId === session.playerId ? (
        <button type="button" className="button" onClick={startGame}>
          Start game
        </button>
      ) : (
        <p className="waiting">Waiting for host to start the game…</p>
      )}
      {error && <p className="error">{error}</p>}

      <button type="button" className="leave" onClick={leave}>
        Leave lobby
      </button>
    </main>
  );
}

export default LobbyPage;
