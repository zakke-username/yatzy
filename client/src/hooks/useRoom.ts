import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { joinRoom } from "../lib/api.ts";
import { socket } from "../lib/socket.ts";
import type { JoinResponse, PublicRoomState } from "../../../shared/types.ts";

export function useRoom(roomId: string) {
  const navigate = useNavigate();
  // Get session data (id and token) from browser storage
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

    const onState = (state: PublicRoomState) => {
      setRoom(state);
      // Check if game's finished
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

  return { session, room, join, leave };
}
