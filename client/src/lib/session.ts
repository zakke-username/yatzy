import type { JoinResponse } from "../../../shared/types.ts";

// sessionStorage is per tab: a refresh keeps your seat, and other tabs can join as other players
const key = (roomId: string) => `free-yatzy:${roomId}`;

export function loadSession(roomId: string): JoinResponse | null {
  const stored = sessionStorage.getItem(key(roomId));
  return stored ? JSON.parse(stored) : null;
}

export function saveSession(session: JoinResponse) {
  sessionStorage.setItem(key(session.roomId), JSON.stringify(session));
}

export function clearSession(roomId: string) {
  sessionStorage.removeItem(key(roomId));
}
