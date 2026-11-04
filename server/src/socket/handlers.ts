import { endTurn, removePlayer, startGame } from "../game/engine.ts";
import { getRoomAndPlayer } from "../store/rooms.ts";
import { deleteSessions, getSession } from "../store/sessions.ts";
import {
  broadcast,
  closeRoom,
  updateCloseTimer,
  type GameServer,
} from "./io.ts";

export function registerSocketHandlers(io: GameServer) {
  // Client is identified by auth token in socket handshake
  io.use((socket, next) => {
    const session = getSession(socket.handshake.auth.token);
    if (!session) return next(new Error("UNAUTHORIZED"));
    socket.data = session;
    next();
  });

  io.on("connection", (socket) => {
    // Make sure that player belongs to a room
    const found = getRoomAndPlayer(socket.data);
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

    // Socket handlers
    // Each one looks up the player & room again, making sure that IDs point to something valid
    socket.on("room:leave", () => {
      const found = getRoomAndPlayer(socket.data);
      if (!found) return;

      socket.leave(found.room.id);
      if (
        found.room.status === "waiting" &&
        found.player.id === found.room.hostId
      ) {
        // If host leaves a lobby -> close room
        closeRoom(io, found.room);
      } else {
        // Just remove player
        removePlayer(found.room, found.player.id);
        deleteSessions((session) => session.playerId === found.player.id);
        updateCloseTimer(io, found.room);
        broadcast(io, found.room);
      }
    });

    socket.on("game:start", (ack) => {
      // The ack comes from the client too, and calling a non-function would throw
      if (typeof ack !== "function") return;

      const found = getRoomAndPlayer(socket.data);
      if (!found) return ack({ ok: false, error: "ROOM_NOT_FOUND" });
      const error = startGame(found.room, found.player.id);
      if (error) return ack({ ok: false, error });

      broadcast(io, found.room);
      ack({ ok: true });
    });

    socket.on("turn:end", (ack) => {
      if (typeof ack !== "function") return;

      const found = getRoomAndPlayer(socket.data);
      if (!found) return ack({ ok: false, error: "ROOM_NOT_FOUND" });
      const error = endTurn(found.room, found.player.id);
      if (error) return ack({ ok: false, error });

      broadcast(io, found.room);
      ack({ ok: true });
    });

    socket.on("disconnect", () => {
      const found = getRoomAndPlayer(socket.data);
      // Ignore players who already left, and sockets replaced by a newer connection
      if (!found || found.player.socketId !== socket.id) return;

      found.player.socketId = null;
      updateCloseTimer(io, found.room);
      broadcast(io, found.room);
    });
  });
}
