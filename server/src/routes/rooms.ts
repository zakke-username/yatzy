import type { Express, Response } from "express";
import { updateCloseTimer, type GameServer } from "../socket/io.ts";
import { addPlayer, createRoom, MAX_PLAYERS, rooms } from "../store/rooms.ts";
import type { ApiError } from "../types.ts";

const MAX_NAME_LENGTH = 20;

function parseName(value: unknown) {
  const name = typeof value === "string" ? value.trim() : "";
  return name.length > 0 && name.length <= MAX_NAME_LENGTH ? name : null;
}

function sendError(res: Response, status: number, error: ApiError) {
  res.status(status).json({ error });
}

// HTTP requests for creating and joining rooms, because sockets use an auth token already in the handshake
export function registerRoomRoutes(app: Express, io: GameServer) {
  app.post("/api/rooms", (req, res) => {
    const name = parseName(req.body?.name);
    if (!name) return sendError(res, 400, "BAD_INPUT");

    const { room, session } = createRoom(name);
    // The host isn't connected yet, so this starts the timer that closes the room if they never do
    updateCloseTimer(io, room);
    res.status(201).json(session);
  });

  app.post("/api/rooms/:roomId/players", (req, res) => {
    const name = parseName(req.body?.name);
    if (!name) return sendError(res, 400, "BAD_INPUT");

    const room = rooms.get(req.params.roomId);
    if (!room) return sendError(res, 404, "ROOM_NOT_FOUND");
    if (room.status !== "waiting") return sendError(res, 409, "GAME_STARTED");
    if (room.players.length >= MAX_PLAYERS)
      return sendError(res, 409, "ROOM_FULL");

    res.status(201).json(addPlayer(room, name));
  });
}
