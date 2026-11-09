export type Session = {
  roomId: string;
  playerId: string;
};

// Tokens live only here, never on a room, so broadcasting room state can't leak them
const sessions = new Map<string, Session>();

export function getSession(token: string) {
  const session = sessions.get(token);
  return session && structuredClone(session);
}

export function saveSession(token: string, session: Session) {
  sessions.set(token, structuredClone(session));
}

export function deleteSessions(matches: (session: Session) => boolean) {
  for (const [token, session] of sessions) {
    if (matches(session)) sessions.delete(token);
  }
}
