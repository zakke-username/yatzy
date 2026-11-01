import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";
import { registerLobbyRoutes } from "./routes/lobbies.ts";
import { registerSocketHandlers } from "./socket/handlers.ts";
import type { GameServer } from "./socket/io.ts";

const PORT = Number(process.env.PORT) || 3000;

const app = express();
const httpServer = createServer(app);
const io: GameServer = new Server(httpServer);

app.use(express.json());
registerLobbyRoutes(app, io);
registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
