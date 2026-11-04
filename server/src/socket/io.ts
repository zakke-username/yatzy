import type { DefaultEventsMap, Server } from "socket.io";
import { toPublicState, type Room } from "../game/engine.ts";
import { deleteRoom } from "../store/rooms.ts";
import { deleteSessions, type Session } from "../store/sessions.ts";
import type { ClientToServerEvents, ServerToClientEvents } from "../types.ts";

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

export function broadcast(io: GameServer, room: Room) {
  io.to(room.id).emit("room:state", toPublicState(room));
}

export function closeRoom(io: GameServer, room: Room) {
  io.to(room.id).emit("room:closed");
  io.socketsLeave(room.id);
  cancelCloseTimer(room.id);
  deleteRoom(room.id);
  deleteSessions((session) => session.roomId === room.id);
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
    const timer = setTimeout(() => closeRoom(io, room), CLOSE_GRACE_MS);
    closeTimers.set(room.id, timer);
  }
}

function cancelCloseTimer(roomId: string) {
  clearTimeout(closeTimers.get(roomId));
  closeTimers.delete(roomId);
}
