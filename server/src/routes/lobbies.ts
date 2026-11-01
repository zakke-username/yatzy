import type { Express, Response } from 'express'
import { scheduleHostLeave, type GameServer } from '../socket/io.ts'
import { addPlayer, createLobby, lobbies, MAX_PLAYERS } from '../store/lobbies.ts'
import type { ApiError } from '../types.ts'

const MAX_NAME_LENGTH = 20

// Names are cosmetic: trimmed, length-limited, and rendered as plain text by the client
function parseName(value: unknown) {
  const name = typeof value === 'string' ? value.trim() : ''
  return name.length > 0 && name.length <= MAX_NAME_LENGTH ? name : null
}

function sendError(res: Response, status: number, error: ApiError) {
  res.status(status).json({ error })
}

export function registerLobbyRoutes(app: Express, io: GameServer) {
  app.post('/api/lobbies', (req, res) => {
    const name = parseName(req.body?.name)
    if (!name) return sendError(res, 400, 'BAD_INPUT')

    const { lobby, session } = createLobby(name)
    // Close the lobby if the host never connects
    scheduleHostLeave(io, lobby)
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
}
