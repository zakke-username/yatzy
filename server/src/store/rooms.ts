import type { Room } from "../game/engine.ts";
import type { Session } from "./sessions.ts";

// Only these functions touch the Map, so a database such as Redis could replace it.
// Like a database, they hand out and store copies: a change to a room only counts once it's saved.
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

// The player is the one inside the copied room, so changes to it are saved with the room
export function getRoomAndPlayer({ roomId, playerId }: Session) {
  const room = getRoom(roomId);
  const player = room?.players.find((p) => p.id === playerId);
  return room && player ? { room, player } : undefined;
}
