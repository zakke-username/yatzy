import { randomBytes } from "node:crypto";
import type { Express } from "express";
import { addPlayer, createPlayer, createRoom } from "../game/engine.ts";
import {
  startLeaveTimer,
  updateCloseTimer,
  type GameServer,
} from "../socket/io.ts";
import { getRoom, saveRoom } from "../store/rooms.ts";
import { saveSession } from "../store/sessions.ts";
import type {
  CreateRoomResponse,
  RoomStatusResponse,
} from "../../../shared/types.ts";

const MAX_NAME_LENGTH = 20;

// HTTP requests for checking, creating and joining rooms, because sockets use an auth token already in the handshake
// Errors thrown here go to the error handler in index.ts
export function registerRoomRoutes(app: Express, io: GameServer) {
  app.get("/api/rooms/:roomId", (req, res) => {
    const room = getRoom(req.params.roomId);
    if (!room) return res.status(404).json({ error: "ROOM_NOT_FOUND" });
    res.json({ status: room.status } satisfies RoomStatusResponse);
  });

  app.post("/api/rooms", (_req, res) => {
    let room;
    do {
      room = createRoom();
    } while (getRoom(room.id));
    saveRoom(room);
    updateCloseTimer(room);

    res.status(201).json({ roomId: room.id } satisfies CreateRoomResponse);
  });

  app.post("/api/rooms/:roomId/players", (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name || name.length <= 0 || name.length > MAX_NAME_LENGTH)
      return res.status(400).json({ error: "BAD_INPUT" });

    const room = getRoom(req.params.roomId);
    if (!room) return res.status(404).json({ error: "ROOM_NOT_FOUND" });

    const player = createPlayer(name);
    const error = addPlayer(room, player);
    if (error) return res.status(409).json({ error });
    saveRoom(room);

    const token = randomBytes(32).toString("base64url");
    saveSession(token, { roomId: room.id, playerId: player.id });
    startLeaveTimer(io, room.id, player.id);

    res.status(201).json({ roomId: room.id, playerId: player.id, token });
  });
}
