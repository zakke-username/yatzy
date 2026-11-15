import { randomBytes } from "node:crypto";
import type { Express } from "express";
import { addPlayer, createPlayer, createRoom } from "../game/engine.ts";
import { startLeaveTimer, updateCloseTimer } from "../socket/io.ts";
import { addRoom, getRoom, lockRoom, saveRoom } from "../store/rooms.ts";
import { saveSession } from "../store/sessions.ts";
import type {
  CreateRoomResponse,
  JoinResponse,
  RoomStatusResponse,
} from "../../../shared/types.ts";

const MAX_NAME_LENGTH = 20;

// HTTP requests for checking, creating and joining rooms, because sockets use an auth token already in the handshake.
// Errors thrown here are handled in index.ts.

export function registerRoomRoutes(app: Express) {
  // Check room status
  app.get("/api/rooms/:roomId", async (req, res) => {
    const room = await getRoom(req.params.roomId);
    if (!room) return res.status(404).json({ error: "ROOM_NOT_FOUND" });
    res.json({ status: room.status } satisfies RoomStatusResponse);
  });

  // Create new room. Returns the room ID/code.
  app.post("/api/rooms", async (_req, res) => {
    let room;
    do {
      room = createRoom();
    } while (!(await addRoom(room)));
    await updateCloseTimer(room);

    res.status(201).json({ roomId: room.id } satisfies CreateRoomResponse);
  });

  // Join an existing room
  // Creates a new player. Returns the auth token, player ID, and room ID.
  app.post("/api/rooms/:roomId/players", async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name || name.length <= 0 || name.length > MAX_NAME_LENGTH)
      return res.status(400).json({ error: "BAD_INPUT" });

    // Update room state inside db lock
    await lockRoom(req.params.roomId, async () => {
      const room = await getRoom(req.params.roomId);
      if (!room) return res.status(404).json({ error: "ROOM_NOT_FOUND" });

      const player = createPlayer(name);
      const error = addPlayer(room, player);
      if (error) return res.status(409).json({ error });
      await saveRoom(room);

      // Assign 256-bit cryptographically random auth token
      const token = randomBytes(32).toString("base64url");
      await saveSession(token, { roomId: room.id, playerId: player.id });

      // Auto-kicks new player in case they never connect via socket
      await startLeaveTimer(room.id, player.id);

      res
        .status(201)
        .json({
          roomId: room.id,
          playerId: player.id,
          token,
        } satisfies JoinResponse);
    });
  });
}
