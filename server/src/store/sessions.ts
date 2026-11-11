export type Session = {
  roomId: string;
  playerId: string;
};

const sessions = new Map<string, Session>();
const roomTokens = new Map<string, Map<string, string>>();

export function getSession(token: string) {
  const session = sessions.get(token);
  return session && structuredClone(session);
}

export function saveSession(token: string, session: Session) {
  sessions.set(token, structuredClone(session));
  const tokens = roomTokens.get(session.roomId) ?? new Map<string, string>();
  tokens.set(session.playerId, token);
  roomTokens.set(session.roomId, tokens);
}

export function deleteSession(roomId: string, playerId: string) {
  const tokens = roomTokens.get(roomId);
  const token = tokens?.get(playerId);
  if (!tokens || !token) return;
  sessions.delete(token);
  tokens.delete(playerId);
}

export function deleteRoomSessions(roomId: string) {
  for (const token of roomTokens.get(roomId)?.values() ?? []) {
    sessions.delete(token);
  }
  roomTokens.delete(roomId);
}
