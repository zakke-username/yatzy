import type { DefaultEventsMap, Server } from "socket.io";
import { deleteLobby, toPublicState, type Lobby } from "../store/lobbies.ts";
import type { Session } from "../store/sessions.ts";
import type { ClientToServerEvents, ServerToClientEvents } from "../types.ts";

export type GameServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  DefaultEventsMap,
  Session
>;

// How long the host may be disconnected (e.g. during a page refresh) before the lobby closes
const HOST_LEAVE_GRACE_MS = 30_000;

export function broadcast(io: GameServer, lobby: Lobby) {
  io.to(lobby.id).emit("lobby:state", toPublicState(lobby));
}

export function closeLobby(io: GameServer, lobby: Lobby) {
  io.to(lobby.id).emit("lobby:closed");
  io.socketsLeave(lobby.id);
  deleteLobby(lobby);
}

export function scheduleHostLeave(io: GameServer, lobby: Lobby) {
  lobby.hostLeaveTimer = setTimeout(
    () => closeLobby(io, lobby),
    HOST_LEAVE_GRACE_MS,
  );
}
