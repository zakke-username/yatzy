import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { clearSession } from "../lib/session.ts";
import { socket } from "../lib/socket.ts";
import type { JoinResponse, PublicRoomState } from "../types.ts";

export function useRoom(session: JoinResponse | null) {
  const navigate = useNavigate();
  const [room, setRoom] = useState<PublicRoomState | null>(null);

  // Forget this room and return to the front page, optionally showing a message there
  const exit = useCallback(
    (message?: string) => {
      if (session) clearSession(session.roomId);
      socket.disconnect();
      navigate("/", { replace: true, state: { message } });
    },
    [session, navigate],
  );

  useEffect(() => {
    if (!session) return;

    const onClosed = () => exit("Lobby closed: host has left");
    const onConnectError = () => {
      // An inactive socket means the server rejected the token, rather than a network error that will be retried
      if (!socket.active) exit("This lobby no longer exists");
    };
    const onDisconnect = (reason: string) => {
      // The server only disconnects a player itself when they connect again from another tab
      if (reason === "io server disconnect")
        exit("This lobby was opened in another tab");
    };

    socket.auth = { token: session.token };
    socket.on("room:state", setRoom);
    socket.on("room:closed", onClosed);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);
    socket.connect();

    return () => {
      socket.off("room:state", setRoom);
      socket.off("room:closed", onClosed);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [session, exit]);

  const leave = useCallback(() => {
    socket.emit("room:leave");
    exit();
  }, [exit]);

  const start = useCallback(() => socket.emitWithAck("game:start"), []);

  return { room, leave, start };
}
