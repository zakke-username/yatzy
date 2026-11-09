import { randomBytes } from "node:crypto";
import type { Express } from "express";
import { addPlayer, createPlayer, createRoom } from "../game/engine.ts";
import { updateCloseTimer, type GameServer } from "../socket/io.ts";
import { getRoom, saveRoom } from "../store/rooms.ts";
import { saveSession } from "../store/sessions.ts";
import type { RoomStatusResponse } from "../../../shared/types.ts";

const MAX_NAME_LENGTH = 20;

function parseName(value: unknown) {
  const name = typeof value === "string" ? value.trim() : "";
  return name.length > 0 && name.length <= MAX_NAME_LENGTH ? name : null;
}

// HTTP requests for checking, creating and joining rooms, because sockets use an auth token already in the handshake
export function registerRoomRoutes(app: Express, io: GameServer) {
  app.get("/api/rooms/:roomId", (req, res) => {
    try {
      const room = getRoom(req.params.roomId);
      if (!room) return res.status(404).json({ error: "ROOM_NOT_FOUND" });
      res.json({ status: room.status } satisfies RoomStatusResponse);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "SERVER_ERROR" });
    }
  });

  app.post("/api/rooms", (req, res) => {
    try {
      const name = parseName(req.body?.name);
      if (!name) return res.status(400).json({ error: "BAD_INPUT" });

      const host = createPlayer(name);

      let room;
      do {
        room = createRoom(host);
      } while (getRoom(room.id));
      saveRoom(room);
      updateCloseTimer(io, room);

      const token = randomBytes(32).toString("base64url");
      saveSession(token, { roomId: room.id, playerId: host.id });

      res.status(201).json({ roomId: room.id, playerId: host.id, token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "SERVER_ERROR" });
    }
  });

  app.post("/api/rooms/:roomId/players", (req, res) => {
    try {
      const name = parseName(req.body?.name);
      if (!name) return res.status(400).json({ error: "BAD_INPUT" });

      const room = getRoom(req.params.roomId);
      if (!room) return res.status(404).json({ error: "ROOM_NOT_FOUND" });

      const player = createPlayer(name);
      const error = addPlayer(room, player);
      if (error) return res.status(409).json({ error });
      saveRoom(room);

      const token = randomBytes(32).toString("base64url");
      saveSession(token, { roomId: room.id, playerId: player.id });

      res.status(201).json({ roomId: room.id, playerId: player.id, token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "SERVER_ERROR" });
    }
  });
}
