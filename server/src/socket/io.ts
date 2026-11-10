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

// How long a room may have nobody connected before it closes
const CLOSE_GRACE_MS = 10 * 60_000;

// Timers are live handles in this process, so they're kept here rather than on the stored room
const closeTimers = new Map<string, NodeJS.Timeout>();

// Call after anything that changes who is in the room or connected to it.
export function updateCloseTimer(room: Room) {
  const abandoned = !room.players.some((player) => player.socketId !== null);

  if (!abandoned) {
    clearTimeout(closeTimers.get(room.id));
    closeTimers.delete(room.id);
  } else if (!closeTimers.has(room.id)) {
    const timer = setTimeout(() => {
      closeTimers.delete(room.id);
      deleteRoom(room.id);
      deleteSessions((session) => session.roomId === room.id);
    }, CLOSE_GRACE_MS);
    closeTimers.set(room.id, timer);
  }
}
