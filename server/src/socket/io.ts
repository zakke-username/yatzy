import type { DefaultEventsMap, Server } from "socket.io";
import { deleteRoom, toPublicState, type Room } from "../store/rooms.ts";
import type { Session } from "../store/sessions.ts";
import type { ClientToServerEvents, ServerToClientEvents } from "../types.ts";

export type GameServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  DefaultEventsMap,
  Session
>;

// How long a room may stay abandoned (e.g. during a page refresh) before it closes
const CLOSE_GRACE_MS = 30_000;

export function broadcast(io: GameServer, room: Room) {
  io.to(room.id).emit("room:state", toPublicState(room));
}

export function closeRoom(io: GameServer, room: Room) {
  io.to(room.id).emit("room:closed");
  io.socketsLeave(room.id);
  deleteRoom(room);
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
    clearTimeout(room.closeTimer);
    room.closeTimer = undefined;
  } else if (!room.closeTimer) {
    room.closeTimer = setTimeout(() => closeRoom(io, room), CLOSE_GRACE_MS);
  }
}
