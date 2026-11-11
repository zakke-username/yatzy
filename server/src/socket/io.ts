import type { DefaultEventsMap, Server } from "socket.io";
import { removePlayer, toPublicState, type Room } from "../game/engine.ts";
import { deleteRoom, getRoom, saveRoom } from "../store/rooms.ts";
import {
  deleteRoomSessions,
  deleteSession,
  type Session,
} from "../store/sessions.ts";
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

// Timeout to close empty room
const CLOSE_GRACE_MS = 10 * 60_000;
// Timeout to kick a disconnected player
const LEAVE_GRACE_MS = 30_000;

const closeTimers = new Map<string, NodeJS.Timeout>();
const leaveTimers = new Map<string, NodeJS.Timeout>();

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
      deleteRoomSessions(room.id);
    }, CLOSE_GRACE_MS);
    closeTimers.set(room.id, timer);
  }
}

// Leaving, disconnecting and leave timer both end here
export function leaveRoom(io: GameServer, roomId: string, playerId: string) {
  const room = getRoom(roomId);
  const player = room?.players.find((p) => p.id === playerId);
  if (!room || !player) return;

  removePlayer(room, player.id);
  saveRoom(room);
  deleteSession(room.id, player.id);
  updateCloseTimer(room);
  io.to(room.id).emit("room:state", toPublicState(room));
}

export function startLeaveTimer(
  io: GameServer,
  roomId: string,
  playerId: string,
) {
  cancelLeaveTimer(playerId);
  const timer = setTimeout(() => {
    leaveTimers.delete(playerId);
    try {
      leaveRoom(io, roomId, playerId);
    } catch (err) {
      console.error(err);
    }
  }, LEAVE_GRACE_MS);
  leaveTimers.set(playerId, timer);
}

export function cancelLeaveTimer(playerId: string) {
  clearTimeout(leaveTimers.get(playerId));
  leaveTimers.delete(playerId);
}
