import { createServer } from "node:http";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { rateLimit } from "express-rate-limit";
import { Server } from "socket.io";
import { registerRoomRoutes } from "./routes/rooms.ts";
import { registerSocketHandlers } from "./socket/handlers.ts";
import type { GameServer } from "./socket/io.ts";

const PORT = Number(process.env.PORT) || 3000;

const app = express();
const httpServer = createServer(app);
const io: GameServer = new Server(httpServer, {
  maxHttpBufferSize: 10_000,
  serveClient: false,
});

app.set("trust proxy", 1);
app.disable("x-powered-by");

// Rate limiter per client IP
app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    limit: 60,
    message: { error: "RATE_LIMITED" },
  }),
);
app.use(express.json({ limit: "1kb" }));
registerRoomRoutes(app, io);

// Error handling
app.use(
  (
    err: { status?: number },
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    if (err.status && err.status < 500)
      return res.status(err.status).json({ error: "BAD_INPUT" });
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
  },
);

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
