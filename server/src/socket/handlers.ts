import {
  endTurn,
  removePlayer,
  rollDice,
  startGame,
  toPublicState,
} from "../game/engine.ts";
import { getRoom, saveRoom } from "../store/rooms.ts";
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
    const { roomId, playerId } = socket.data;

    // Make sure that player belongs to a room
    const room = getRoom(roomId);
    const player = room?.players.find((p) => p.id === playerId);
    if (!room || !player) return socket.disconnect(true);

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
        const room = getRoom(roomId);
        const player = room?.players.find((p) => p.id === playerId);
        if (!room || !player) return ack();

        socket.leave(room.id);
        if (room.status === "waiting" && player.id === room.hostId) {
          // If host leaves a lobby -> close whole room
          closeRoom(io, room.id);
        } else {
          // otherwise just remove player
          removePlayer(room, player.id);
          saveRoom(room);
          deleteSessions((session) => session.playerId === player.id);
          updateCloseTimer(io, room);
          io.to(room.id).emit("room:state", toPublicState(room));
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
        const room = getRoom(roomId);
        const player = room?.players.find((p) => p.id === playerId);
        if (!room || !player)
          return ack({ ok: false, error: "ROOM_NOT_FOUND" });

        const error = startGame(room, player.id);
        if (error) return ack({ ok: false, error });

        saveRoom(room);
        io.to(room.id).emit("room:state", toPublicState(room));
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

        const room = getRoom(roomId);
        const player = room?.players.find((p) => p.id === playerId);
        if (!room || !player)
          return ack({ ok: false, error: "ROOM_NOT_FOUND" });

        const error = rollDice(room, player.id, held);
        if (error) return ack({ ok: false, error });

        saveRoom(room);
        io.to(room.id).emit("room:state", toPublicState(room));
        ack({ ok: true });
      } catch (err) {
        console.error(err);
        ack({ ok: false, error: "SERVER_ERROR" });
      }
    });

    socket.on("turn:end", (ack) => {
      if (typeof ack !== "function") return;

      try {
        const room = getRoom(roomId);
        const player = room?.players.find((p) => p.id === playerId);
        if (!room || !player)
          return ack({ ok: false, error: "ROOM_NOT_FOUND" });

        const error = endTurn(room, player.id);
        if (error) return ack({ ok: false, error });

        saveRoom(room);
        io.to(room.id).emit("room:state", toPublicState(room));
        ack({ ok: true });
      } catch (err) {
        console.error(err);
        ack({ ok: false, error: "SERVER_ERROR" });
      }
    });

    socket.on("disconnect", () => {
      try {
        const room = getRoom(roomId);
        const player = room?.players.find((p) => p.id === playerId);
        // Ignore players who already left, and sockets replaced by a newer connection
        if (!room || !player || player.socketId !== socket.id) return;

        player.socketId = null;
        saveRoom(room);
        updateCloseTimer(io, room);
        io.to(room.id).emit("room:state", toPublicState(room));
      } catch (err) {
        console.error(err);
      }
    });
  });
}
