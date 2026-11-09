import {
  endTurn,
  removePlayer,
  rollDice,
  startGame,
  toPublicState,
} from "../game/engine.ts";
import { getRoomAndPlayer, saveRoom } from "../store/rooms.ts";
import { deleteSessions, getSession } from "../store/sessions.ts";
import { DICE_COUNT } from "../../../shared/types.ts";
import { closeRoom, updateCloseTimer, type GameServer } from "./io.ts";

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

    // A duplicated tab shares the token, so the newest connection wins and the old one is kicked.
    // Save first: the kick runs the old socket's disconnect handler straight away, and it must see the new socket ID
    const previousSocketId = player.socketId;
    player.socketId = socket.id;
    saveRoom(room);
    if (previousSocketId)
      io.sockets.sockets.get(previousSocketId)?.disconnect(true);

    updateCloseTimer(io, room);
    socket.join(room.id);
    io.to(room.id).emit("room:state", toPublicState(room));

    // Socket handlers
    // Each one looks up the player & room again, making sure that IDs point to something valid
    // Each one catches its own errors: Socket.IO runs handlers in process.nextTick, so a throw would crash the server and wipe every room
    // Acked so the client disconnects only after this has run: Socket.IO drops an event that arrives together with the disconnect
    socket.on("room:leave", (ack) => {
      if (typeof ack !== "function") return;

      try {
        const found = getRoomAndPlayer(socket.data);
        if (!found) return ack();

        socket.leave(found.room.id);
        if (
          found.room.status === "waiting" &&
          found.player.id === found.room.hostId
        ) {
          // If host leaves a lobby -> close whole room
          closeRoom(io, found.room.id);
        } else {
          // otherwise just remove player
          removePlayer(found.room, found.player.id);
          saveRoom(found.room);
          deleteSessions((session) => session.playerId === found.player.id);
          updateCloseTimer(io, found.room);
          io.to(found.room.id).emit("room:state", toPublicState(found.room));
        }
        ack();
      } catch (err) {
        console.error(err);
        ack();
      }
    });

    socket.on("game:start", (ack) => {
      // The ack comes from the client too, and calling a non-function would throw
      if (typeof ack !== "function") return;

      try {
        const found = getRoomAndPlayer(socket.data);
        if (!found) return ack({ ok: false, error: "ROOM_NOT_FOUND" });
        const error = startGame(found.room, found.player.id);
        if (error) return ack({ ok: false, error });

        saveRoom(found.room);
        io.to(found.room.id).emit("room:state", toPublicState(found.room));
        ack({ ok: true });
      } catch (err) {
        console.error(err);
        ack({ ok: false, error: "SERVER_ERROR" });
      }
    });

    socket.on("turn:roll", (payload, ack) => {
      if (typeof ack !== "function") return;

      try {
        const held = payload?.held;

        // Validate input: array of booleans of right length
        const isHeldArray =
          Array.isArray(held) &&
          held.length === DICE_COUNT &&
          held.every((item) => typeof item === "boolean");
        if (!isHeldArray) return ack({ ok: false, error: "BAD_INPUT" });

        const found = getRoomAndPlayer(socket.data);
        if (!found) return ack({ ok: false, error: "ROOM_NOT_FOUND" });
        const error = rollDice(found.room, found.player.id, held);
        if (error) return ack({ ok: false, error });

        saveRoom(found.room);
        io.to(found.room.id).emit("room:state", toPublicState(found.room));
        ack({ ok: true });
      } catch (err) {
        console.error(err);
        ack({ ok: false, error: "SERVER_ERROR" });
      }
    });

    socket.on("turn:end", (ack) => {
      if (typeof ack !== "function") return;

      try {
        const found = getRoomAndPlayer(socket.data);
        if (!found) return ack({ ok: false, error: "ROOM_NOT_FOUND" });
        const error = endTurn(found.room, found.player.id);
        if (error) return ack({ ok: false, error });

        saveRoom(found.room);
        io.to(found.room.id).emit("room:state", toPublicState(found.room));
        ack({ ok: true });
      } catch (err) {
        console.error(err);
        ack({ ok: false, error: "SERVER_ERROR" });
      }
    });

    socket.on("disconnect", () => {
      try {
        const found = getRoomAndPlayer(socket.data);
        // Ignore players who already left, and sockets replaced by a newer connection
        if (!found || found.player.socketId !== socket.id) return;

        found.player.socketId = null;
        saveRoom(found.room);
        updateCloseTimer(io, found.room);
        io.to(found.room.id).emit("room:state", toPublicState(found.room));
      } catch (err) {
        console.error(err);
      }
    });
  });
}
