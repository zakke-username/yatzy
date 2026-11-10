import type {
  ApiError,
  CreateRoomResponse,
  JoinResponse,
  RoomStatusResponse,
} from "../../../shared/types.ts";

export const ERROR_MESSAGES: Record<ApiError, string> = {
  BAD_INPUT: "Please enter a name",
  ROOM_NOT_FOUND: "Lobby not found",
  ROOM_FULL: "This lobby is full",
  GAME_STARTED: "This game has already started",
  NOT_HOST: "Only the host can start the game",
  NOT_YOUR_TURN: "It's not your turn",
  NO_ROLLS_LEFT: "You have no rolls left this turn",
  NOT_ROLLED: "Roll the dice before scoring",
  CATEGORY_TAKEN: "You have already scored that category",
  SERVER_ERROR: "Something went wrong on the server",
};

// A GET, or a POST when there's a body. Resolves to the response, or throws an Error with a message to show.
async function request<T>(path: string, body?: object): Promise<T> {
  const res = await fetch(
    path,
    body && {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const data = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(
      ERROR_MESSAGES[data?.error as ApiError] ?? "Could not reach the server",
    );
  return data;
}

export async function getRoomStatus(roomId: string) {
  const { status } = await request<RoomStatusResponse>(
    `/api/rooms/${encodeURIComponent(roomId)}`,
  );
  return status;
}

export async function createRoom() {
  const { roomId } = await request<CreateRoomResponse>("/api/rooms", {});
  return roomId;
}

export function joinRoom(roomId: string, name: string) {
  return request<JoinResponse>(
    `/api/rooms/${encodeURIComponent(roomId)}/players`,
    { name },
  );
}
