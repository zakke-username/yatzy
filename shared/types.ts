// API contract between server and client
export type RoomStatus = "waiting" | "playing" | "finished";

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

/** Yatzy scoring categories, in scorecard order */
export const CATEGORIES = [...UPPER_CATEGORIES, ...LOWER_CATEGORIES] as const;

export type Category = (typeof CATEGORIES)[number];

export const DICE_COUNT = 5;
export const ROLLS_PER_TURN = 3;

/** Player's score */
export type Scores = Record<Category, number>;

export type PublicPlayer = {
  id: string;
  name: string;
  connected: boolean;
  scores: Scores;
  /** Ones to sixes */
  sum: number;
  bonus: number;
  /** Every score plus the bonus */
  total: number;
};

/** A room is both a lobby and a game */
export type PublicRoomState = {
  id: string;
  hostId: string;
  status: RoomStatus;
  maxPlayers: number;
  players: PublicPlayer[];
  currentPlayerId: string | null;
  dice: number[];
  rollsLeft: number;
};

/** Returned when creating or joining a room. */
export type JoinResponse = {
  roomId: string;
  playerId: string;
  token: string;
};

export type ApiError =
  | "BAD_INPUT"
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "GAME_STARTED"
  | "NOT_HOST"
  | "NOT_YOUR_TURN"
  | "NO_ROLLS_LEFT";

/** The acknowledgement of every client event except room:leave, whose ack carries nothing */
export type AckResponse = { ok: true } | { ok: false; error: ApiError };

export type ServerToClientEvents = {
  "room:state": (state: PublicRoomState) => void;
  "room:closed": () => void;
};

export type ClientToServerEvents = {
  "room:leave": (ack: () => void) => void;
  "game:start": (ack: (response: AckResponse) => void) => void;
  "turn:roll": (
    payload: { held: boolean[] },
    ack: (response: AckResponse) => void,
  ) => void;
  "turn:end": (ack: (response: AckResponse) => void) => void;
};
