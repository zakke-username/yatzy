import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import LobbyInvite from "../components/LobbyInvite.tsx";
import NameDialog from "../components/NameDialog.tsx";
import PlayerList from "../components/PlayerList.tsx";
import { useRoom } from "../hooks/useRoom.ts";
import { ERROR_MESSAGES, getRoomStatus } from "../lib/api.ts";
import { socket } from "../lib/socket.ts";
import "./LobbyPage.css";

function LobbyPage() {
  const roomId = useParams().roomId!.toUpperCase();
  const navigate = useNavigate();
  const { session, room, join, leave } = useRoom(roomId);
  const [error, setError] = useState("");
  const [joinable, setJoinable] = useState(false);

  // Check if room can be joined
  useEffect(() => {
    if (session) return;
    let ignoreRedirect = false; // Don't redirect if player has already left the page
    async function checkRoom() {
      try {
        const status = await getRoomStatus(roomId);
        if (ignoreRedirect) return;
        if (status === "waiting") {
          setJoinable(true);
        } else {
          navigate("/", {
            replace: true,
            state: { message: ERROR_MESSAGES.GAME_STARTED },
          });
        }
      } catch (err) {
        if (!ignoreRedirect)
          navigate("/", {
            replace: true,
            state: { message: (err as Error).message },
          });
      }
    }
    checkRoom();
    return () => {
      ignoreRedirect = true;
    };
  }, [roomId, session, navigate]);

  async function startGame() {
    // On success the new status arrives in room:state, which sends everyone to the game page
    // Rejects if the connection drops before the server answers
    const res = await socket.emitWithAck("game:start").catch(() => undefined);
    if (res && !res.ok) setError(ERROR_MESSAGES[res.error]);
  }

  // No token for this room in this tab yet -> join as a new player
  if (!session && joinable) {
    return <NameDialog onSubmit={join} onCancel={() => navigate("/")} />;
  }

  if (!session || !room) {
    return (
      <main className="page">
        <p>Connecting to lobby...</p>
      </main>
    );
  }

  if (room.status !== "waiting")
    return <Navigate to={`/game/${room.id}`} replace />;

  return (
    <main className="page">
      <div className="container">
        <LobbyInvite roomId={room.id} />
        <hr></hr>
        <PlayerList room={room} playerId={session.playerId} />
        <hr></hr>

        {room.hostId === session.playerId ? (
          <button type="button" className="button" onClick={startGame}>
            Start game
          </button>
        ) : (
          <p className="waiting">Waiting for host to start the game…</p>
        )}
        {error && <p className="error">{error}</p>}

        <button type="button" className="button exit-button" onClick={leave}>
          Exit lobby
        </button>
      </div>
    </main>
  );
}

export default LobbyPage;
