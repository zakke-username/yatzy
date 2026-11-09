import type { DefaultEventsMap, Server } from "socket.io";
import { type Room } from "../game/engine.ts";
import { deleteRoom } from "../store/rooms.ts";
import { deleteSessions, type Session } from "../store/sessions.ts";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../../shared/types.ts";

export type GameServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  DefaultEventsMap,
  Session
>;

// How long a room may stay abandoned (e.g. during a page refresh) before it closes
const CLOSE_GRACE_MS = 30_000;

// Timers are live handles in this process, so they're kept here rather than on the stored room
const closeTimers = new Map<string, NodeJS.Timeout>();

// export function broadcast(io: GameServer, room: Room) {
//   io.to(room.id).emit("room:state", toPublicState(room));
// }

export function closeRoom(io: GameServer, roomId: string) {
  io.to(roomId).emit("room:closed");
  io.socketsLeave(roomId);
  cancelCloseTimer(roomId);
  deleteRoom(roomId);
  deleteSessions((session) => session.roomId === roomId);
}

// Call after anything that changes who is in the room or connected to it.
// A waiting room is abandoned without its host, and a started game without any connected player.
export function updateCloseTimer(io: GameServer, room: Room) {
  const connected = room.players.filter((player) => player.socketId !== null);
  const abandoned =
    room.status === "waiting"
      ? !connected.some((player) => player.id === room.hostId)
      : connected.length === 0;

  if (!abandoned) {
    cancelCloseTimer(room.id);
  } else if (!closeTimers.has(room.id)) {
    const timer = setTimeout(() => closeRoom(io, room.id), CLOSE_GRACE_MS);
    closeTimers.set(room.id, timer);
  }
}

function cancelCloseTimer(roomId: string) {
  clearTimeout(closeTimers.get(roomId));
  closeTimers.delete(roomId);
}
