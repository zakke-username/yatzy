import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import NameDialog from "../components/NameDialog.tsx";
import { useRoom } from "../hooks/useRoom.ts";
import { ERROR_MESSAGES, getRoomStatus } from "../lib/api.ts";
import Game from "./Game.tsx";
import Lobby from "./Lobby.tsx";

// Room's page for both lobby and game
// Stays mounted, so socket connection stays too
function Room() {
  const roomId = useParams().roomId!.toUpperCase();
  const navigate = useNavigate();
  const { session, room, join, leave, reset } = useRoom(roomId);
  const [joinable, setJoinable] = useState(false);

  // No token/session: check if can be joined
  useEffect(() => {
    if (session) return;
    let ignore = false;
    async function checkRoom() {
      try {
        const status = await getRoomStatus(roomId);
        if (status !== "waiting") throw new Error(ERROR_MESSAGES.GAME_STARTED);
        if (!ignore) setJoinable(true);
      } catch (err) {
        if (!ignore)
          navigate("/", {
            replace: true,
            state: { message: (err as Error).message },
          });
      }
    }
    checkRoom();
    return () => {
      ignore = true;
    };
  }, [roomId, session, navigate]);

  function playAgain() {
    setJoinable(false);
    reset();
  }

  if (!session && joinable) {
    return <NameDialog onSubmit={join} onCancel={() => navigate("/")} />;
  }

  if (!session || !room) {
    return (
      <main>
        <b>Connecting...</b>
      </main>
    );
  }

  if (room.status === "waiting") {
    return <Lobby room={room} playerId={session.playerId} onLeave={leave} />;
  }

  return (
    <Game
      room={room}
      playerId={session.playerId}
      onLeave={leave}
      onPlayAgain={playAgain}
    />
  );
}

export default Room;
