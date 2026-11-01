import type { JoinResponse } from "../types.ts";

// sessionStorage is per tab: a refresh keeps your seat, and other tabs can join as other players
const key = (lobbyId: string) => `free-yatzy:${lobbyId}`;

export function loadSession(lobbyId: string): JoinResponse | null {
  const stored = sessionStorage.getItem(key(lobbyId));
  return stored ? JSON.parse(stored) : null;
}

export function saveSession(session: JoinResponse) {
  sessionStorage.setItem(key(session.lobbyId), JSON.stringify(session));
}

export function clearSession(lobbyId: string) {
  sessionStorage.removeItem(key(lobbyId));
}
