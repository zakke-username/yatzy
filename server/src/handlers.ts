import type { Express, Response } from 'express'
import type { DefaultEventsMap, Server } from 'socket.io'
import {
  addPlayer,
  createLobby,
  deleteLobby,
  findPlayer,
  lobbies,
  MAX_PLAYERS,
  removePlayer,
  sessions,
  toPublicState,
  type Lobby,
  type Session,
} from './store.ts'
import type { ApiError, ClientToServerEvents, ServerToClientEvents } from './types.ts'

export type GameServer = Server<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, Session>

// How long the host may be disconnected (e.g. during a page refresh) before the lobby closes
const HOST_LEAVE_GRACE_MS = 30_000
const MAX_NAME_LENGTH = 20

// Names are cosmetic: trimmed, length-limited, and rendered as plain text by the client
function parseName(value: unknown) {
  const name = typeof value === 'string' ? value.trim() : ''
  return name.length > 0 && name.length <= MAX_NAME_LENGTH ? name : null
}

function sendError(res: Response, status: number, error: ApiError) {
  res.status(status).json({ error })
}

export function registerHandlers(app: Express, io: GameServer) {
  function broadcast(lobby: Lobby) {
    io.to(lobby.id).emit('lobby:state', toPublicState(lobby))
  }

  function closeLobby(lobby: Lobby) {
    io.to(lobby.id).emit('lobby:closed')
    io.socketsLeave(lobby.id)
    deleteLobby(lobby)
  }

  function scheduleHostLeave(lobby: Lobby) {
    lobby.hostLeaveTimer = setTimeout(() => closeLobby(lobby), HOST_LEAVE_GRACE_MS)
  }

  app.post('/api/lobbies', (req, res) => {
    const name = parseName(req.body?.name)
    if (!name) return sendError(res, 400, 'BAD_INPUT')

    const { lobby, session } = createLobby(name)
    // Close the lobby if the host never connects
    scheduleHostLeave(lobby)
    res.status(201).json(session)
  })

  app.post('/api/lobbies/:lobbyId/players', (req, res) => {
    const name = parseName(req.body?.name)
    if (!name) return sendError(res, 400, 'BAD_INPUT')

    const lobby = lobbies.get(req.params.lobbyId)
    if (!lobby) return sendError(res, 404, 'LOBBY_NOT_FOUND')
    if (lobby.status !== 'waiting') return sendError(res, 409, 'GAME_STARTED')
    if (lobby.players.length >= MAX_PLAYERS) return sendError(res, 409, 'LOBBY_FULL')

    res.status(201).json(addPlayer(lobby, name))
  })

  // Identity comes only from the token issued at create/join, never from event payloads
  io.use((socket, next) => {
    const session = sessions.get(socket.handshake.auth.token)
    if (!session) return next(new Error('UNAUTHORIZED'))
    socket.data = session
    next()
  })

  io.on('connection', (socket) => {
    // Sessions are deleted together with their player and lobby, so the lookup can't fail here
    const { lobby, player } = findPlayer(socket.data)!

    // One live connection per player: the newest wins
    const previousSocketId = player.socketId
    player.socketId = socket.id
    if (previousSocketId) io.sockets.sockets.get(previousSocketId)?.disconnect(true)

    if (player.id === lobby.hostId) clearTimeout(lobby.hostLeaveTimer)

    socket.join(lobby.id)
    broadcast(lobby)

    socket.on('lobby:leave', () => {
      const found = findPlayer(socket.data)
      if (!found) return

      socket.leave(found.lobby.id)
      if (found.player.id === found.lobby.hostId) {
        closeLobby(found.lobby)
      } else {
        removePlayer(found.lobby, found.player.id)
        broadcast(found.lobby)
      }
    })

    socket.on('disconnect', () => {
      const found = findPlayer(socket.data)
      // Ignore players who already left, and sockets replaced by a newer connection
      if (!found || found.player.socketId !== socket.id) return

      found.player.socketId = null
      if (found.player.id === found.lobby.hostId) scheduleHostLeave(found.lobby)
      broadcast(found.lobby)
    })
  })
}
