// Timers are stored as a sorted set in Redis ("timers" -> string-number pair)
// Each timer stores a "score", which is a timestamp after which it's run out

import { redis, TTL_S } from "./redis.ts";

export async function startTimer(name: string, ms: number) {
  await redis.zAdd(
    "timers",
    { score: Date.now() + ms, value: name },
    { condition: "NX" },
  );
}

export async function cancelTimer(name: string) {
  await redis.zRem("timers", name);
}

export async function getDueTimers() {
  // Drop timers that stay stuck
  await redis.zRemRangeByScore("timers", 0, Date.now() - TTL_S * 1000);
  return redis.zRangeByScore("timers", 0, Date.now());
}

export async function isDue(name: string) {
  const due = await redis.zScore("timers", name);
  return due !== null && due <= Date.now();
}
