// The API contract between server and client. client/src/types.ts is an exact copy: change both together.

export type RoomStatus = "waiting" | "playing" | "finished";

/** The Scandinavian Yatzy categories, in scorecard order */
export const CATEGORIES = [
  "ones",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes",
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

export type Category = (typeof CATEGORIES)[number];

/** A player's score in every category */
export type Scores = Record<Category, number>;

export type PublicPlayer = {
  id: string;
  name: string;
  connected: boolean;
  scores: Scores;
};

/** A room is the lobby until the host starts it, then the game: the same ID, players and tokens throughout */
export type PublicRoomState = {
  id: string;
  hostId: string;
  status: RoomStatus;
  maxPlayers: number;
  players: PublicPlayer[];
  currentPlayerId: string | null;
};

/** Returned when creating or joining a room. The token is secret and identifies the player. */
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
  | "NOT_YOUR_TURN";

/** The acknowledgement of every client event except room:leave */
export type AckResponse = { ok: true } | { ok: false; error: ApiError };

export type ServerToClientEvents = {
  "room:state": (state: PublicRoomState) => void;
  "room:closed": () => void;
};

export type ClientToServerEvents = {
  "room:leave": () => void;
  "game:start": (ack: (response: AckResponse) => void) => void;
  "turn:end": (ack: (response: AckResponse) => void) => void;
};
