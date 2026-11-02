// The API contract between server and client. client/src/types.ts is an exact copy: change both together.

export type RoomStatus = "waiting" | "playing" | "finished";

export type PublicPlayer = {
  id: string;
  name: string;
  connected: boolean;
};

/** A room is the lobby until the host starts it, then the game: the same ID, players and tokens throughout */
export type PublicRoomState = {
  id: string;
  hostId: string;
  status: RoomStatus;
  maxPlayers: number;
  players: PublicPlayer[];
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
  | "NOT_HOST";

/** The acknowledgement of every client event except room:leave */
export type AckResponse = { ok: true } | { ok: false; error: ApiError };

export type ServerToClientEvents = {
  "room:state": (state: PublicRoomState) => void;
  "room:closed": () => void;
};

export type ClientToServerEvents = {
  "room:leave": () => void;
  "game:start": (ack: (response: AckResponse) => void) => void;
};
