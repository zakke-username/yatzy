// Game engine: plain and testable functions
import { randomUUID } from "node:crypto";
import {
  CATEGORIES,
  type ApiError,
  type PublicRoomState,
  type RoomStatus,
  type Scores,
} from "../../../shared/types.ts";

export const MAX_PLAYERS = 8;

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
  players: Player[];
  currentPlayerId: string | null;
};

export function createPlayer(name: string): Player {
  return {
    id: randomUUID(),
    name,
    socketId: null,
    scores: Object.fromEntries(
      CATEGORIES.map((category) => [category, 0]),
    ) as Scores,
  };
}

export function createRoom(id: string, host: Player): Room {
  return {
    id,
    hostId: host.id,
    status: "waiting",
    players: [host],
    currentPlayerId: null,
  };
}

export function addPlayer(room: Room, player: Player): ApiError | undefined {
  if (room.status !== "waiting") return "GAME_STARTED";
  if (room.players.length >= MAX_PLAYERS) return "ROOM_FULL";
  room.players.push(player);
}

export function removePlayer(room: Room, playerId: string) {
  if (room.currentPlayerId === playerId) advanceTurn(room);
  room.players = room.players.filter((player) => player.id !== playerId);
}

export function startGame(room: Room, playerId: string): ApiError | undefined {
  if (playerId !== room.hostId) return "NOT_HOST";
  if (room.status !== "waiting") return "GAME_STARTED";
  room.status = "playing";
  room.currentPlayerId = room.players[0].id;
}

export function endTurn(room: Room, playerId: string): ApiError | undefined {
  // currentPlayerId is null outside a game, so this also rejects the lobby
  if (playerId !== room.currentPlayerId) return "NOT_YOUR_TURN";
  advanceTurn(room);
}

function advanceTurn(room: Room) {
  const index = room.players.findIndex(
    (player) => player.id === room.currentPlayerId,
  );
  room.currentPlayerId = room.players[(index + 1) % room.players.length].id;
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
    currentPlayerId: room.currentPlayerId,
  };
}
