import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import type { Room } from "../game/engine.ts";
import { redis } from "./redis.ts";

const LOCK_MS = 5_000;

// Lua script to release room lock atomically
const RELEASE_LOCK = `if redis.call("GET", KEYS[1]) == ARGV[1] then redis.call("DEL", KEYS[1]) end`;

const roomKey = (id: string) => `room:${id}`;

export async function getRoom(id: string): Promise<Room | undefined> {
  const json = await redis.get(roomKey(id));
  return json ? JSON.parse(json) : undefined;
}

// Create new room. Returns false if room ID taken
export async function addRoom(room: Room) {
  const result = await redis.set(roomKey(room.id), JSON.stringify(room), {
    condition: "NX",
  });
  return result === "OK";
}

export async function saveRoom(room: Room) {
  await redis.set(roomKey(room.id), JSON.stringify(room));
}

export async function deleteRoom(id: string) {
  await redis.del(roomKey(id));
}

// Runs a function while holding a per-room lock
export async function lockRoom<T>(id: string, fn: () => Promise<T>) {
  const key = `${roomKey(id)}:lock`;
  const owner = randomUUID();
  const giveUpAt = Date.now() + LOCK_MS;
  while (
    !(await redis.set(key, owner, {
      condition: "NX",
      expiration: { type: "PX", value: LOCK_MS },
    }))
  ) {
    if (Date.now() > giveUpAt) throw new Error(`Room ${id} stayed locked`);
    await sleep(10);
  }
  try {
    return await fn();
  } finally {
    await redis.eval(RELEASE_LOCK, { keys: [key], arguments: [owner] });
  }
}
