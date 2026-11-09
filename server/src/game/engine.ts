// Game engine: plain and testable functions
import { randomInt, randomUUID } from "node:crypto";
import {
  CATEGORIES,
  DICE_COUNT,
  LOWER_CATEGORIES,
  ROLLS_PER_TURN,
  UPPER_CATEGORIES,
  type ApiError,
  type Category,
  type PublicRoomState,
  type RoomStatus,
  type Scores,
} from "../../../shared/types.ts";
import { calculateScores } from "./scores.ts";

export const MAX_PLAYERS = 8;
const ROOM_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_ID_LENGTH = 6;

// Ones to sixes adding up to at least 63 earn a 50 point bonus
const BONUS_THRESHOLD = 63;
const BONUS = 50;

export type Player = {
  id: string;
  name: string;
  socketId: string | null;
  scores: Scores;
  sum: number;
  bonus: number;
  total: number;
};

// The sum, bonus and total follow from the scores, so recompute them whenever a score changes
function totals(scores: Scores) {
  const add = (categories: readonly Category[]) =>
    categories.reduce((sum, category) => sum + scores[category], 0);
  const sum = add(UPPER_CATEGORIES);
  const bonus = sum >= BONUS_THRESHOLD ? BONUS : 0;
  return { sum, bonus, total: sum + bonus + add(LOWER_CATEGORIES) };
}

export type Room = {
  id: string;
  hostId: string | null;
  status: RoomStatus;
  players: Player[];
  currentPlayerId: string | null;
  dice: number[];
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
    CATEGORIES.map((category) => [category, 0]),
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
    // The game starts with these, and each turn starts with the dice the last one left
    dice: Array.from({ length: DICE_COUNT }, () => randomInt(1, 7)),
    rollsLeft: 0,
  };
}

export function addPlayer(room: Room, player: Player): ApiError | undefined {
  if (room.status !== "waiting") return "GAME_STARTED";
  if (room.players.length >= MAX_PLAYERS) return "ROOM_FULL";
  room.players.push(player);
  room.hostId ??= player.id;
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
// - sets the score, then updates the player's sum, bonus and total: Object.assign(player, totals(player.scores))
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
  room.rollsLeft = ROLLS_PER_TURN;
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
    rollsLeft: room.rollsLeft,
    potentialScores: calculateScores(room.dice),
  };
}
