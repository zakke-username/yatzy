import { randomInt, randomUUID } from 'node:crypto'
import type { JoinResponse, LobbyStatus, PublicLobbyState } from '../types.ts'
import { createSession, deleteSessions, type Session } from './sessions.ts'

export const MAX_PLAYERS = 6

export type Player = {
  id: string
  name: string
  socketId: string | null
}

export type Lobby = {
  id: string
  hostId: string
  status: LobbyStatus
  players: Player[]
  hostLeaveTimer?: NodeJS.Timeout
}

export const lobbies = new Map<string, Lobby>()

// No 0/O or 1/I/L, so codes are easy to read out and type
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8

function newLobbyId() {
  let id: string
  do {
    id = Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('')
  } while (lobbies.has(id))
  return id
}

export function createLobby(hostName: string) {
  const lobby: Lobby = { id: newLobbyId(), hostId: '', status: 'waiting', players: [] }
  lobbies.set(lobby.id, lobby)

  const session = addPlayer(lobby, hostName)
  lobby.hostId = session.playerId
  return { lobby, session }
}

export function addPlayer(lobby: Lobby, name: string): JoinResponse {
  const player: Player = { id: randomUUID(), name, socketId: null }
  lobby.players.push(player)

  const token = createSession({ lobbyId: lobby.id, playerId: player.id })
  return { lobbyId: lobby.id, playerId: player.id, token }
}

export function removePlayer(lobby: Lobby, playerId: string) {
  lobby.players = lobby.players.filter((player) => player.id !== playerId)
  deleteSessions((session) => session.playerId === playerId)
}

export function deleteLobby(lobby: Lobby) {
  clearTimeout(lobby.hostLeaveTimer)
  lobbies.delete(lobby.id)
  deleteSessions((session) => session.lobbyId === lobby.id)
}

export function findPlayer({ lobbyId, playerId }: Session) {
  const lobby = lobbies.get(lobbyId)
  const player = lobby?.players.find((p) => p.id === playerId)
  return lobby && player ? { lobby, player } : undefined
}

export function toPublicState(lobby: Lobby): PublicLobbyState {
  return {
    id: lobby.id,
    hostId: lobby.hostId,
    status: lobby.status,
    maxPlayers: MAX_PLAYERS,
    players: lobby.players.map(({ id, name, socketId }) => ({ id, name, connected: socketId !== null })),
  }
}
