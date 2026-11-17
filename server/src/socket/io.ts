import type { DefaultEventsMap, Server } from "socket.io";
import {
  createRoom,
  removePlayer,
  toPublicState,
  type Room,
} from "../game/engine.ts";
import { deleteRoom, getRoom, lockRoom, saveRoom } from "../store/rooms.ts";
import {
  deleteRoomSessions,
  deleteSession,
  type Session,
} from "../store/sessions.ts";
import {
  cancelTimer,
  getDueTimers,
  isDue,
  startTimer,
} from "../store/timers.ts";
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
// Interval between sweeps of checking the db if timers are due
const SWEEP_MS = 1000;

// Close room automatically if abandoned. Called after players change.
export async function updateCloseTimer(room: Room) {
  const abandoned = !room.players.some((player) => player.socketId !== null);
  if (abandoned) await startTimer(`close:${room.id}`, CLOSE_GRACE_MS);
  else await cancelTimer(`close:${room.id}`);
}

// Leaving, disconnecting and the leave timer end here.
export async function leaveRoom(
  io: GameServer,
  roomId: string,
  playerId: string,
) {
  const room = await getRoom(roomId);
  const player = room?.players.find((p) => p.id === playerId);
  if (!room || !player) return;

  removePlayer(room, player.id);
  await saveRoom(room);
  await deleteSession(room.id, player.id);
  await updateCloseTimer(room);
  io.to(room.id).emit("room:state", toPublicState(room));
  if (room.status === "finished") await resetRoom(io, room);
}

// Resets room to lobby state and removes players. Called after game finishes.
export async function resetRoom(io: GameServer, room: Room) {
  io.in(room.id).socketsLeave(room.id);
  await deleteRoomSessions(room.id);
  const newRoom = { ...createRoom(), id: room.id };
  await saveRoom(newRoom);
  await updateCloseTimer(newRoom);
}

// Kick player automatically on disconnect
export async function startLeaveTimer(roomId: string, playerId: string) {
  await startTimer(`leave:${roomId}:${playerId}`, LEAVE_GRACE_MS);
}

export async function cancelLeaveTimer(roomId: string, playerId: string) {
  await cancelTimer(`leave:${roomId}:${playerId}`);
}

// Search the database for timers periodically (autokick, auto delete room)
export function startTimerSweep(io: GameServer) {
  const sweep = async () => {
    try {
      for (const name of await getDueTimers()) {
        const [kind, roomId, playerId] = name.split(":");
        await lockRoom(roomId, async () => {
          // re-check, in case timer is reset while waiting for lock
          if (!(await isDue(name))) return;
          if (kind === "leave") await leaveRoom(io, roomId, playerId);
          else {
            await deleteRoom(roomId);
            await deleteRoomSessions(roomId);
          }
          await cancelTimer(name);
        });
      }
    } catch (err) {
      console.error(err);
    }
    setTimeout(sweep, SWEEP_MS);
  };
  sweep();
}
