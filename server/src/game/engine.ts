// Game engine: plain and testable functions
import { randomInt, randomUUID } from "node:crypto";
import {
  CATEGORIES,
  DICE_COUNT,
  ROLLS_PER_TURN,
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
  dice: number[];
  rollsLeft: number;
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
    dice: Array.from({ length: DICE_COUNT }, () => randomInt(1, 7)),
    rollsLeft: 0,
  };
}

export function addPlayer(room: Room, player: Player): ApiError | undefined {
  if (room.status !== "waiting") return "GAME_STARTED";
  if (room.players.length >= MAX_PLAYERS) return "ROOM_FULL";
  room.players.push(player);
}

export function removePlayer(room: Room, playerId: string) {
  if (room.currentPlayerId === playerId) nextTurn(room);
  room.players = room.players.filter((player) => player.id !== playerId);
}

export function startGame(room: Room, playerId: string): ApiError | undefined {
  if (playerId !== room.hostId) return "NOT_HOST";
  if (room.status !== "waiting") return "GAME_STARTED";

  room.status = "playing";
  room.currentPlayerId = room.players[0].id;
  room.dice = Array.from({ length: DICE_COUNT }, () => randomInt(1, 7));
  room.rollsLeft = ROLLS_PER_TURN;
}

export function rollDice(
  room: Room,
  playerId: string,
  held: boolean[],
): ApiError | undefined {
  // currentPlayerId is null outside a game, so this also rejects the lobby
  if (playerId !== room.currentPlayerId) return "NOT_YOUR_TURN";
  if (room.rollsLeft === 0) return "NO_ROLLS_LEFT";

  // On first roll, all dice are rolled
  const firstRoll = room.rollsLeft === ROLLS_PER_TURN;
  room.dice = room.dice.map((value, i) =>
    held[i] && !firstRoll ? value : randomInt(1, 7),
  );

  room.rollsLeft--;
}

// Todo here when adding scoring:
// - takes the selected category as parameter
// - checks that player has rolled at least once, and that the selected category is empty. before calling next turn.
export function endTurn(room: Room, playerId: string): ApiError | undefined {
  if (playerId !== room.currentPlayerId) return "NOT_YOUR_TURN";
  nextTurn(room);
}

function nextTurn(room: Room) {
  const currentPlayerIndex = room.players.findIndex(
    (player) => player.id === room.currentPlayerId,
  );
  const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
  room.currentPlayerId = room.players[nextPlayerIndex].id;
  room.dice = Array.from({ length: DICE_COUNT }, () => randomInt(1, 7));
  room.rollsLeft = ROLLS_PER_TURN;
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
    dice: room.dice,
    rollsLeft: room.rollsLeft,
  };
}
