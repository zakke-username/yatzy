import { createClient } from "redis";

// Redis client
export const redis = await createClient({ url: process.env.REDIS_URL })
  .on("error", (err) => console.error(err))
  .connect();

// 24h TTL for rooms and sessions
export const TTL_S = 24 * 60 * 60;
