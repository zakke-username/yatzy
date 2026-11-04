import type { Room } from "../game/engine.ts";
import type { Session } from "./sessions.ts";

// Only these functions touch the Map, so a database such as Redis could replace it
const rooms = new Map<string, Room>();

export function getRoom(id: string) {
  return rooms.get(id);
}

export function saveRoom(room: Room) {
  rooms.set(room.id, room);
}

export function deleteRoom(id: string) {
  rooms.delete(id);
}

export function getRoomAndPlayer({ roomId, playerId }: Session) {
  const room = rooms.get(roomId);
  const player = room?.players.find((p) => p.id === playerId);
  return room && player ? { room, player } : undefined;
}
