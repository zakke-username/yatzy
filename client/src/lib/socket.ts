import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '../types.ts'

// Connects to the page's own origin; Vite proxies /socket.io to the server in development.
// useLobby connects it once the player has a session token.
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({ autoConnect: false })
