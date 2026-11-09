import type { Room } from "../game/engine.ts";

const rooms = new Map<string, Room>();

export function getRoom(id: string) {
  const room = rooms.get(id);
  return room && structuredClone(room);
}

export function saveRoom(room: Room) {
  rooms.set(room.id, structuredClone(room));
}

export function deleteRoom(id: string) {
  rooms.delete(id);
}
