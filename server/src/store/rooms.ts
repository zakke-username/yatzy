import { randomInt, randomUUID } from "node:crypto";
import {
  CATEGORIES,
  type JoinResponse,
  type PublicRoomState,
  type RoomStatus,
  type Scores,
} from "../types.ts";
import { createSession, deleteSessions, type Session } from "./sessions.ts";

export const MAX_PLAYERS = 6;

export type Player = {
  id: string;
  name: string;
  socketId: string | null;
  scores: Scores;
};

export type Room = {
  id: string;
  hostId: string;
  status: RoomStatus;
  /** In join order, which is also the turn order once the game starts */
  players: Player[];
  closeTimer?: NodeJS.Timeout;
};

export const rooms = new Map<string, Room>();

// No 0/O/1/I for room codes
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

function newRoomId() {
  let id: string;
  do {
    id = Array.from(
      { length: CODE_LENGTH },
      () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
    ).join("");
  } while (rooms.has(id));
  return id;
}

export function createRoom(hostName: string) {
  const room: Room = {
    id: newRoomId(),
    hostId: "",
    status: "waiting",
    players: [],
  };
  rooms.set(room.id, room);

  const session = addPlayer(room, hostName);
  room.hostId = session.playerId;
  return { room, session };
}

export function addPlayer(room: Room, name: string): JoinResponse {
  const player: Player = {
    id: randomUUID(),
    name,
    socketId: null,
    scores: Object.fromEntries(
      CATEGORIES.map((category) => [category, 0]),
    ) as Scores,
  };
  room.players.push(player);

  const token = createSession({ roomId: room.id, playerId: player.id });
  return { roomId: room.id, playerId: player.id, token };
}

export function removePlayer(room: Room, playerId: string) {
  room.players = room.players.filter((player) => player.id !== playerId);
  deleteSessions((session) => session.playerId === playerId);
}

export function deleteRoom(room: Room) {
  clearTimeout(room.closeTimer);
  rooms.delete(room.id);
  deleteSessions((session) => session.roomId === room.id);
}

export function findPlayer({ roomId, playerId }: Session) {
  const room = rooms.get(roomId);
  const player = room?.players.find((p) => p.id === playerId);
  return room && player ? { room, player } : undefined;
}

export function toPublicState(room: Room): PublicRoomState {
  return {
    id: room.id,
    hostId: room.hostId,
    status: room.status,
    maxPlayers: MAX_PLAYERS,
    players: room.players.map(({ id, name, socketId, scores }) => ({
      id,
      name,
      connected: socketId !== null,
      scores,
    })),
  };
}
