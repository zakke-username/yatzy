import { redis } from "./redis.ts";

// Stores key-value pairs:
// Token -> session (room id and player id).
// Room ID -> player IDs and tokens (hash). Helps with deleting rooms, don't have to scan all stored tokens.

export type Session = {
  roomId: string;
  playerId: string;
};

const sessionKey = (token: string) => `session:${token}`;
const tokensKey = (roomId: string) => `room:${roomId}:tokens`;

export async function getSession(token: string): Promise<Session | undefined> {
  const json = await redis.get(sessionKey(token));
  return json ? JSON.parse(json) : undefined;
}

// multi/exec (atomic write) keeps sessions and rooms synchronized
export async function saveSession(token: string, session: Session) {
  await redis
    .multi()
    .set(sessionKey(token), JSON.stringify(session))
    .hSet(tokensKey(session.roomId), session.playerId, token)
    .exec();
}

export async function deleteSession(roomId: string, playerId: string) {
  const token = await redis.hGet(tokensKey(roomId), playerId);
  if (!token) return;
  await redis
    .multi()
    .del(sessionKey(token))
    .hDel(tokensKey(roomId), playerId)
    .exec();
}

export async function deleteRoomSessions(roomId: string) {
  const tokens = await redis.hVals(tokensKey(roomId));
  await redis.del([tokensKey(roomId), ...tokens.map(sessionKey)]);
}
