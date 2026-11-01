export type LobbyStatus = "waiting" | "playing" | "finished";

export type PublicPlayer = {
  id: string;
  name: string;
  connected: boolean;
};

export type PublicLobbyState = {
  id: string;
  hostId: string;
  status: LobbyStatus;
  maxPlayers: number;
  players: PublicPlayer[];
};

export type JoinResponse = {
  lobbyId: string;
  playerId: string;
  token: string;
};

export type ApiError =
  | "BAD_INPUT"
  | "LOBBY_NOT_FOUND"
  | "LOBBY_FULL"
  | "GAME_STARTED";

export type ServerToClientEvents = {
  "lobby:state": (state: PublicLobbyState) => void;
  "lobby:closed": () => void;
};

export type ClientToServerEvents = {
  "lobby:leave": () => void;
};
