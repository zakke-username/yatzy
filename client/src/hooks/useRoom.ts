import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { joinRoom } from "../lib/api.ts";
import { socket } from "../lib/socket.ts";
import type { JoinResponse, PublicRoomState } from "../../../shared/types.ts";

// The player's session in a room (their token) and the socket connection that uses it.
// sessionStorage is per tab, keyed by room ID: a refresh keeps the seat, and other tabs can join as other players.
export function useRoom(roomId: string) {
  const navigate = useNavigate();
  const [session, setSession] = useState<JoinResponse | null>(() => {
    const stored = sessionStorage.getItem(roomId);
    return stored ? JSON.parse(stored) : null;
  });
  const [room, setRoom] = useState<PublicRoomState | null>(null);

  useEffect(() => {
    if (!session) return;

    const exit = (message: string) => {
      sessionStorage.removeItem(roomId);
      navigate("/", { replace: true, state: { message } });
    };

    // Server refused token
    const onConnectError = () => {
      if (!socket.active) exit("This lobby no longer exists");
    };

    // Duplicate tab
    const onDisconnect = (reason: string) => {
      if (reason === "io server disconnect") exit("Disconnected by server");
    };

    socket.auth = { token: session.token };
    socket.on("room:state", setRoom);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.connect();

    return () => {
      socket.off("room:state", setRoom);
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

  return { session, room, join, leave };
}
