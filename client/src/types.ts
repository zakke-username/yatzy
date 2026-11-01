// The API contract between server and client. server/src/types.ts is an exact copy: change both together.

export type LobbyStatus = 'waiting' | 'playing' | 'finished'

export type PublicPlayer = {
  id: string
  name: string
  connected: boolean
}

export type PublicLobbyState = {
  id: string
  hostId: string
  status: LobbyStatus
  maxPlayers: number
  players: PublicPlayer[]
}

/** Returned when creating or joining a lobby. The token is secret and identifies the player. */
export type JoinResponse = {
  lobbyId: string
  playerId: string
  token: string
}

export type ApiError = 'BAD_INPUT' | 'LOBBY_NOT_FOUND' | 'LOBBY_FULL' | 'GAME_STARTED'

export type ServerToClientEvents = {
  'lobby:state': (state: PublicLobbyState) => void
  'lobby:closed': () => void
}

export type ClientToServerEvents = {
  'lobby:leave': () => void
}
