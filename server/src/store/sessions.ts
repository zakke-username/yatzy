import { randomBytes } from 'node:crypto'

export type Session = {
  lobbyId: string
  playerId: string
}

// Tokens live only here, never on a lobby, so broadcasting lobby state can't leak them
export const sessions = new Map<string, Session>()

export function createSession(session: Session) {
  const token = randomBytes(32).toString('base64url')
  sessions.set(token, session)
  return token
}

export function deleteSessions(matches: (session: Session) => boolean) {
  for (const [token, session] of sessions) {
    if (matches(session)) sessions.delete(token)
  }
}
