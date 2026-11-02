import { findPlayer, removePlayer } from "../store/rooms.ts";
import { sessions } from "../store/sessions.ts";
import {
  broadcast,
  closeRoom,
  updateCloseTimer,
  type GameServer,
} from "./io.ts";

export function registerSocketHandlers(io: GameServer) {
  // Identity comes only from the token issued at create/join, never from event payloads
  io.use((socket, next) => {
    const session = sessions.get(socket.handshake.auth.token);
    if (!session) return next(new Error("UNAUTHORIZED"));
    socket.data = session;
    next();
  });

  io.on("connection", (socket) => {
    // Socket.IO connects a tick after the handshake, so the player may have left in between
    const found = findPlayer(socket.data);
    if (!found) return socket.disconnect(true);
    const { room, player } = found;

    // One live connection per player: the newest wins
    const previousSocketId = player.socketId;
    player.socketId = socket.id;
    if (previousSocketId)
      io.sockets.sockets.get(previousSocketId)?.disconnect(true);

    updateCloseTimer(io, room);
    socket.join(room.id);
    broadcast(io, room);

    // The handlers look the player up again, because they may have left or the room closed since connecting

    socket.on("room:leave", () => {
      const found = findPlayer(socket.data);
      if (!found) return;

      socket.leave(found.room.id);
      // The host leaving closes a room that is still a lobby, but a started game goes on without them
      if (
        found.room.status === "waiting" &&
        found.player.id === found.room.hostId
      ) {
        closeRoom(io, found.room);
      } else {
        removePlayer(found.room, found.player.id);
        updateCloseTimer(io, found.room);
        broadcast(io, found.room);
      }
    });

    socket.on("game:start", (ack) => {
      // The ack comes from the client too, and calling a non-function would throw
      if (typeof ack !== "function") return;

      const found = findPlayer(socket.data);
      if (!found) return ack({ ok: false, error: "ROOM_NOT_FOUND" });
      if (found.player.id !== found.room.hostId)
        return ack({ ok: false, error: "NOT_HOST" });
      if (found.room.status !== "waiting")
        return ack({ ok: false, error: "GAME_STARTED" });

      found.room.status = "playing";
      // The new status in the snapshot is what moves every client to the game page
      broadcast(io, found.room);
      ack({ ok: true });
    });

    socket.on("disconnect", () => {
      const found = findPlayer(socket.data);
      // Ignore players who already left, and sockets replaced by a newer connection
      if (!found || found.player.socketId !== socket.id) return;

      found.player.socketId = null;
      updateCloseTimer(io, found.room);
      broadcast(io, found.room);
    });
  });
}
