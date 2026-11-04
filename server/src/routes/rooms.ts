import { randomBytes, randomInt } from "node:crypto";
import type { Express, Response } from "express";
import {
  addPlayer,
  createPlayer,
  createRoom,
  type Player,
  type Room,
} from "../game/engine.ts";
import { updateCloseTimer, type GameServer } from "../socket/io.ts";
import { getRoom, saveRoom } from "../store/rooms.ts";
import { saveSession } from "../store/sessions.ts";
import type { ApiError, JoinResponse } from "../types.ts";

const MAX_NAME_LENGTH = 20;

// No 0/O/1/I for room codes
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

function parseName(value: unknown) {
  const name = typeof value === "string" ? value.trim() : "";
  return name.length > 0 && name.length <= MAX_NAME_LENGTH ? name : null;
}

function sendError(res: Response, status: number, error: ApiError) {
  res.status(status).json({ error });
}

function newRoomId() {
  let id: string;
  do {
    id = Array.from(
      { length: CODE_LENGTH },
      () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
    ).join("");
  } while (getRoom(id));
  return id;
}

// The token is the player's secret identity, and this response is the only time it's sent
function issueToken(room: Room, player: Player): JoinResponse {
  const token = randomBytes(32).toString("base64url");
  saveSession(token, { roomId: room.id, playerId: player.id });
  return { roomId: room.id, playerId: player.id, token };
}

// HTTP requests for creating and joining rooms, because sockets use an auth token already in the handshake
export function registerRoomRoutes(app: Express, io: GameServer) {
  app.post("/api/rooms", (req, res) => {
    const name = parseName(req.body?.name);
    if (!name) return sendError(res, 400, "BAD_INPUT");

    const host = createPlayer(name);
    const room = createRoom(newRoomId(), host);
    saveRoom(room);
    // The host isn't connected yet, so this starts the timer that closes the room if they never do
    updateCloseTimer(io, room);
    res.status(201).json(issueToken(room, host));
  });

  app.post("/api/rooms/:roomId/players", (req, res) => {
    const name = parseName(req.body?.name);
    if (!name) return sendError(res, 400, "BAD_INPUT");

    const room = getRoom(req.params.roomId);
    if (!room) return sendError(res, 404, "ROOM_NOT_FOUND");

    const player = createPlayer(name);
    const error = addPlayer(room, player);
    if (error) return sendError(res, 409, error);
    res.status(201).json(issueToken(room, player));
  });
}
