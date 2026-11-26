import type { ChatMessage } from "../../../shared/types.ts";
import { redis, TTL_S } from "./redis.ts";

// Stores each room's latest chat messages as a list of strings

const MAX_CHAT_HISTORY = 100;

const chatKey = (roomId: string) => `room:${roomId}:chat`;

export async function getChat(roomId: string): Promise<ChatMessage[]> {
  const items = await redis.lRange(chatKey(roomId), 0, -1);
  return items.map((json) => JSON.parse(json));
}

// Appends the message and drops the oldest ones past the cap
export async function saveChatMessage(roomId: string, message: ChatMessage) {
  await redis
    .multi()
    .rPush(chatKey(roomId), JSON.stringify(message))
    .lTrim(chatKey(roomId), -MAX_CHAT_HISTORY, -1)
    .expire(chatKey(roomId), TTL_S)
    .exec();
}

export async function deleteChat(roomId: string) {
  await redis.del(chatKey(roomId));
}
