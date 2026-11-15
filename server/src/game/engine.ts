// Game engine: plain and testable functions
import { randomInt, randomUUID } from "node:crypto";
import {
  CATEGORIES,
  DICE_COUNT,
  ROLLS_PER_TURN,
  type ApiError,
  type Category,
  type PublicRoomState,
  type RoomStatus,
  type Scores,
} from "../../../shared/types.ts";
import { calculateScores, totals } from "./scores.ts";

export const MAX_PLAYERS = 8;
const ROOM_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_ID_LENGTH = 6;

export type Player = {
  id: string;
  name: string;
  socketId: string | null;
  scores: Scores;
  sum: number;
  bonus: number;
  total: number;
};

export type Room = {
  id: string;
  hostId: string | null;
  status: RoomStatus;
  players: Player[];
  currentPlayerId: string | null;
  dice: number[];
  held: boolean[];
  rollsLeft: number;
};

function newRoomId() {
  let id = "";
  for (let i = 0; i < ROOM_ID_LENGTH; i++) {
    id += ROOM_ID_ALPHABET[randomInt(ROOM_ID_ALPHABET.length)];
  }
  return id;
}

export function createPlayer(name: string): Player {
  const scores = Object.fromEntries(
    CATEGORIES.map((category) => [category, null]),
  ) as Scores;
  return { id: randomUUID(), name, socketId: null, scores, ...totals(scores) };
}

export function createRoom(): Room {
  return {
    id: newRoomId(),
    hostId: null,
    status: "waiting",
    players: [],
    currentPlayerId: null,
    dice: Array.from({ length: DICE_COUNT }, () => randomInt(1, 7)),
    held: Array<boolean>(DICE_COUNT).fill(false),
    rollsLeft: 0,
  };
}

export function addPlayer(room: Room, player: Player): ApiError | undefined {
  if (room.status !== "waiting") return "GAME_STARTED";
  if (room.players.length >= MAX_PLAYERS) return "ROOM_FULL";

  room.players.push(player);
  // No host = next player to join becomes host
  room.hostId ??= player.id;
}

export function removePlayer(room: Room, playerId: string) {
  if (room.status === "finished") return; // Final results stay visible
  if (room.currentPlayerId === playerId) nextTurn(room);
  room.players = room.players.filter((player) => player.id !== playerId);
  // If host leaves, next player becomes host
  if (room.hostId === playerId) room.hostId = room.players[0]?.id ?? null;
  finishIfDone(room);
}

export function startGame(room: Room, playerId: string): ApiError | undefined {
  if (playerId !== room.hostId) return "NOT_HOST";
  if (room.status !== "waiting") return "GAME_STARTED";

  room.status = "playing";
  room.currentPlayerId = room.players[0].id;
  room.rollsLeft = ROLLS_PER_TURN;
}

export function rollDice(
  room: Room,
  playerId: string,
  held: boolean[],
): ApiError | undefined {
  if (playerId !== room.currentPlayerId || room.status !== "playing")
    return "NOT_YOUR_TURN";
  if (room.rollsLeft === 0) return "NO_ROLLS_LEFT";

  // If first roll, roll all dice
  const firstRoll = room.rollsLeft === ROLLS_PER_TURN;
  room.held = held.map((isHeld) => isHeld && !firstRoll);
  room.dice = room.dice.map((value, i) =>
    room.held[i] ? value : randomInt(1, 7),
  );
  room.rollsLeft--;
}

// Scores the category with the current dice and passes the turn on
export function endTurn(
  room: Room,
  player: Player,
  category: Category,
): ApiError | undefined {
  if (player.id !== room.currentPlayerId || room.status !== "playing")
    return "NOT_YOUR_TURN";
  if (room.rollsLeft === ROLLS_PER_TURN) return "NOT_ROLLED";
  if (player.scores[category] !== null) return "CATEGORY_TAKEN";

  player.scores[category] = calculateScores(room.dice)[category];
  Object.assign(player, totals(player.scores));
  nextTurn(room);
  finishIfDone(room);
}

function nextTurn(room: Room) {
  const currentPlayerIndex = room.players.findIndex(
    (player) => player.id === room.currentPlayerId,
  );
  const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
  room.currentPlayerId = room.players[nextPlayerIndex].id;
  room.rollsLeft = ROLLS_PER_TURN;
}

// If all players have filled all scores, game is over
function finishIfDone(room: Room) {
  if (room.status !== "playing") return;
  const done = room.players.every(
    (player) =>
      player.socketId === null || !Object.values(player.scores).includes(null),
  );
  if (!done) return;
  room.status = "finished";
}

export function toPublicState(room: Room): PublicRoomState {
  return {
    id: room.id,
    hostId: room.hostId,
    status: room.status,
    maxPlayers: MAX_PLAYERS,
    players: room.players.map(
      ({ id, name, socketId, scores, sum, bonus, total }) => ({
        id,
        name,
        connected: socketId !== null,
        scores,
        sum,
        bonus,
        total,
      }),
    ),
    currentPlayerId: room.currentPlayerId,
    dice: room.dice,
    held: room.held,
    rollsLeft: room.rollsLeft,
    potentialScores: calculateScores(room.dice),
  };
}
