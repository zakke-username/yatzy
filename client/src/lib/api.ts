import type { ApiError, JoinResponse } from "../../../shared/types.ts";
import { saveSession } from "./session.ts";

// Shared by REST errors and socket acknowledgements
export const ERROR_MESSAGES: Record<ApiError, string> = {
  BAD_INPUT: "Please enter a name",
  ROOM_NOT_FOUND: "Lobby not found",
  ROOM_FULL: "This lobby is full",
  GAME_STARTED: "This game has already started",
  NOT_HOST: "Only the host can start the game",
  NOT_YOUR_TURN: "It's not your turn",
};

async function requestSession(path: string, name: string) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(
      ERROR_MESSAGES[body?.error as ApiError] ?? "Could not reach the server",
    );

  const session: JoinResponse = body;
  saveSession(session);
  return session;
}

export function createRoom(name: string) {
  return requestSession("/api/rooms", name);
}

export function joinRoom(roomId: string, name: string) {
  return requestSession(
    `/api/rooms/${encodeURIComponent(roomId)}/players`,
    name,
  );
}
