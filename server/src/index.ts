import { createServer } from 'node:http'
import express from 'express'
import { Server } from 'socket.io'
import { registerHandlers, type GameServer } from './handlers.ts'

const PORT = Number(process.env.PORT) || 3000

const app = express()
const httpServer = createServer(app)
const io: GameServer = new Server(httpServer)

app.use(express.json())
registerHandlers(app, io)

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
