import type { ApiError, JoinResponse } from "../types.ts";
import { saveSession } from "./session.ts";

const ERROR_MESSAGES: Record<ApiError, string> = {
  BAD_INPUT: "Please enter a name",
  LOBBY_NOT_FOUND: "Lobby not found",
  LOBBY_FULL: "This lobby is full",
  GAME_STARTED: "This game has already started",
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

export function createLobby(name: string) {
  return requestSession("/api/lobbies", name);
}

export function joinLobby(lobbyId: string, name: string) {
  return requestSession(
    `/api/lobbies/${encodeURIComponent(lobbyId)}/players`,
    name,
  );
}
