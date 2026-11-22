import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { joinRoom } from "../lib/api.ts";
import { socket } from "../lib/socket.ts";
import type { JoinResponse, PublicRoomState } from "../../../shared/types.ts";

// Player's session in a room (in sessionStorage)
// and socket connection
export function useRoom(roomId: string) {
  const navigate = useNavigate();
  const [session, setSession] = useState<JoinResponse | null>(() => {
    const stored = sessionStorage.getItem(roomId);
    return stored ? JSON.parse(stored) : null;
  });
  const [room, setRoom] = useState<PublicRoomState | null>(null);

  // Connected while there is a session
  useEffect(() => {
    if (!session) return;

    const exit = (message: string) => {
      sessionStorage.removeItem(roomId);
      navigate("/", { replace: true, state: { message } });
    };

    // Server refused the token: player was removed or the room closed
    const onConnectError = () => {
      if (!socket.active) exit("This lobby no longer exists");
    };

    // Server kicked this connection: a newer tab took the seat
    const onDisconnect = (reason: string) => {
      if (reason === "io server disconnect") exit("Disconnected by server");
    };

    const onState = (state: PublicRoomState) => {
      setRoom(state);

      // When game is over, keep room and session state,
      // but remove token from storage and disconnect socket
      if (state.status === "finished") {
        sessionStorage.removeItem(roomId);
        socket.disconnect();
      }
    };

    socket.auth = { token: session.token };
    socket.on("room:state", onState);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.connect();

    return () => {
      socket.off("room:state", onState);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [roomId, session, navigate]);

  async function join(name: string) {
    const joined = await joinRoom(roomId, name);
    sessionStorage.setItem(roomId, JSON.stringify(joined));
    setSession(joined);
  }

  async function leave() {
    // Waits for the server to handle it, since disconnecting straight away can drop it
    if (socket.connected)
      await socket.emitWithAck("room:leave").catch(() => undefined);
    sessionStorage.removeItem(roomId);
    navigate("/", { replace: true });
  }

  // "Forget" finished game state: tab can join as a new player
  function reset() {
    setSession(null);
    setRoom(null);
  }

  return { session, room, join, leave, reset };
}
