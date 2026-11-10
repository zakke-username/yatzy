import {
  endTurn,
  removePlayer,
  rollDice,
  startGame,
  toPublicState,
} from "../game/engine.ts";
import { getRoom, saveRoom } from "../store/rooms.ts";
import { deleteSessions, getSession } from "../store/sessions.ts";
import { CATEGORIES, DICE_COUNT } from "../../../shared/types.ts";
import { updateCloseTimer, type GameServer } from "./io.ts";

const LEAVE_GRACE_MS = 30_000;
const leaveTimers = new Map<string, NodeJS.Timeout>();

export function registerSocketHandlers(io: GameServer) {
  // Leaving and disconnecting
  function leaveRoom(roomId: string, playerId: string) {
    const room = getRoom(roomId);
    const player = room?.players.find((p) => p.id === playerId);
    if (!room || !player) return;

    removePlayer(room, player.id);
    saveRoom(room);
    deleteSessions((session) => session.playerId === player.id);
    updateCloseTimer(room);
    io.to(room.id).emit("room:state", toPublicState(room));
  }

  // Auth
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

    // Duplicated tab: kick old connection, newest wins
    const previousSocketId = player.socketId;
    player.socketId = socket.id;
    saveRoom(room);
    if (previousSocketId)
      io.sockets.sockets.get(previousSocketId)?.disconnect(true);

    // Clear auto-leave timeout
    clearTimeout(leaveTimers.get(playerId));
    leaveTimers.delete(playerId);

    updateCloseTimer(room);
    socket.join(room.id);
    io.to(room.id).emit("room:state", toPublicState(room));

    // Socket handlers
    // Each one looks up the player & room again, making sure that IDs still point to something that exists
    socket.on("game:start", (ack) => {
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

        // Validate input: held dice is an array of booleans of right length
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

    socket.on("turn:end", (payload, ack) => {
      if (typeof ack !== "function") return;

      try {
        const category = payload?.category;
        if (!CATEGORIES.includes(category))
          return ack({ ok: false, error: "BAD_INPUT" });

        const room = getRoom(roomId);
        const player = room?.players.find((p) => p.id === playerId);
        if (!room || !player)
          return ack({ ok: false, error: "ROOM_NOT_FOUND" });

        const error = endTurn(room, player, category);
        if (error) return ack({ ok: false, error });

        saveRoom(room);
        io.to(room.id).emit("room:state", toPublicState(room));
        ack({ ok: true });
      } catch (err) {
        console.error(err);
        ack({ ok: false, error: "SERVER_ERROR" });
      }
    });

    socket.on("room:leave", (ack) => {
      if (typeof ack !== "function") return;

      try {
        socket.leave(roomId);
        leaveRoom(roomId, playerId);
        ack();
      } catch (err) {
        console.error(err);
        ack();
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
        updateCloseTimer(room);
        io.to(room.id).emit("room:state", toPublicState(room));

        // Automatically remove player after some time
        leaveTimers.set(
          playerId,
          setTimeout(() => {
            leaveTimers.delete(playerId);
            try {
              leaveRoom(roomId, playerId);
            } catch (err) {
              console.error(err);
            }
          }, LEAVE_GRACE_MS),
        );
      } catch (err) {
        console.error(err);
      }
    });
  });
}
