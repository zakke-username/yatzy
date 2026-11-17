// Shared contract between server and client

export type RoomStatus = "waiting" | "playing" | "finished";

// Separate upper and lower categories, for ease of calculating sums
export const UPPER_CATEGORIES = [
  "ones",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes",
] as const;

export const LOWER_CATEGORIES = [
  "onePair",
  "twoPairs",
  "threeOfAKind",
  "fourOfAKind",
  "smallStraight",
  "largeStraight",
  "fullHouse",
  "chance",
  "yatzy",
] as const;

// All scoring categories combined
export const CATEGORIES = [...UPPER_CATEGORIES, ...LOWER_CATEGORIES] as const;

export type Category = (typeof CATEGORIES)[number];

export const DICE_COUNT = 5;
export const ROLLS_PER_TURN = 3;

// Category and score pair. Null if not scored yet.
export type Scores = Record<Category, number | null>;

export type PublicPlayer = {
  id: string;
  name: string;
  connected: boolean;
  scores: Scores;
  sum: number; // upper sum (1s to 6s)
  bonus: number;
  total: number;
};

// Lobby or game
export type PublicRoomState = {
  id: string;
  hostId: string | null; // first player to join becomes host. null until that
  status: RoomStatus;
  maxPlayers: number;
  players: PublicPlayer[];
  currentPlayerId: string | null;
  dice: number[];
  held: boolean[];
  rollsLeft: number;
  turnEndsAt: number;
  potentialScores: Scores;
};

// Returned by POST /api/rooms
export type CreateRoomResponse = {
  roomId: string;
};

// Returned by joining a room (POST /api/rooms/:roomId/players)
export type JoinResponse = {
  roomId: string;
  playerId: string;
  token: string;
};

// Returned by GET /api/rooms/:roomId
export type RoomStatusResponse = {
  status: RoomStatus;
};

export type ApiError =
  | "BAD_INPUT"
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "GAME_STARTED"
  | "NOT_HOST"
  | "NOT_YOUR_TURN"
  | "NO_ROLLS_LEFT"
  | "NOT_ROLLED"
  | "CATEGORY_TAKEN"
  | "RATE_LIMITED"
  | "SERVER_ERROR";

// Every client event except room:leave
export type AckResponse = { ok: true } | { ok: false; error: ApiError };

// Chat
export const MAX_MESSAGE_LENGTH = 200;

export type ChatMessage = {
  id: string;
  playerId: string;
  name: string;
  text: string;
};

// Socket events
export type ServerToClientEvents = {
  "room:state": (state: PublicRoomState) => void;
  "chat:message": (message: ChatMessage) => void;
};

export type ClientToServerEvents = {
  "room:leave": (ack: () => void) => void;
  "game:start": (ack: (response: AckResponse) => void) => void;
  "turn:roll": (
    payload: { held: boolean[] },
    ack: (response: AckResponse) => void,
  ) => void;
  "turn:end": (
    payload: { category: Category },
    ack: (response: AckResponse) => void,
  ) => void;
  "chat:send": (
    payload: { text: string },
    ack: (response: AckResponse) => void,
  ) => void;
};
