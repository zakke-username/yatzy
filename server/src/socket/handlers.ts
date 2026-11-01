import { findPlayer, removePlayer } from '../store/lobbies.ts'
import { sessions } from '../store/sessions.ts'
import { broadcast, closeLobby, scheduleHostLeave, type GameServer } from './io.ts'

export function registerSocketHandlers(io: GameServer) {
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
    broadcast(io, lobby)

    socket.on('lobby:leave', () => {
      const found = findPlayer(socket.data)
      if (!found) return

      socket.leave(found.lobby.id)
      if (found.player.id === found.lobby.hostId) {
        closeLobby(io, found.lobby)
      } else {
        removePlayer(found.lobby, found.player.id)
        broadcast(io, found.lobby)
      }
    })

    socket.on('disconnect', () => {
      const found = findPlayer(socket.data)
      // Ignore players who already left, and sockets replaced by a newer connection
      if (!found || found.player.socketId !== socket.id) return

      found.player.socketId = null
      if (found.player.id === found.lobby.hostId) scheduleHostLeave(io, found.lobby)
      broadcast(io, found.lobby)
    })
  })
}
