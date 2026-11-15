import { randomUUID } from "node:crypto";
import { endTurn, rollDice, startGame, toPublicState } from "../game/engine.ts";
import { getRoom, lockRoom, saveRoom } from "../store/rooms.ts";
import { getSession } from "../store/sessions.ts";
import {
  CATEGORIES,
  DICE_COUNT,
  MAX_MESSAGE_LENGTH,
} from "../../../shared/types.ts";
import {
  cancelLeaveTimer,
  leaveRoom,
  startLeaveTimer,
  updateCloseTimer,
  type GameServer,
} from "./io.ts";

export function registerSocketHandlers(io: GameServer) {
  // Auth
  io.use(async (socket, next) => {
    try {
      const session = await getSession(socket.handshake.auth.token);
      if (!session) return next(new Error("UNAUTHORIZED"));
      socket.data = session;
      next();
    } catch (err) {
      console.error(err);
      next(new Error("SERVER_ERROR"));
    }
  });

  io.on("connection", async (socket) => {
    // Socket rate limiting
    let windowStart = Date.now();
    let events = 0;
    socket.use((_packet, next) => {
      const now = Date.now();
      if (now - windowStart >= 1000) {
        windowStart = now;
        events = 0;
      }
      if (++events > 10) return socket.disconnect(true);
      next();
    });

    // Get IDs always from socket data (saved on server during handshake)
    const { roomId, playerId } = socket.data;

    // SOCKET HANDLERS: each one looks up the player & room again, making sure that IDs still point to something that exists

    // Start game
    socket.on("game:start", async (ack) => {
      if (typeof ack !== "function") return;

      try {
        // Read-modify-write room state inside lock (pass the fn)
        await lockRoom(roomId, async () => {
          const room = await getRoom(roomId);
          const player = room?.players.find((p) => p.id === playerId);
          if (!room || !player)
            return ack({ ok: false, error: "ROOM_NOT_FOUND" });

          const error = startGame(room, player.id);
          if (error) return ack({ ok: false, error });

          await saveRoom(room);
          io.to(room.id).emit("room:state", toPublicState(room));
          ack({ ok: true });
        });
      } catch (err) {
        console.error(err);
        ack({ ok: false, error: "SERVER_ERROR" });
      }
    });

    // Roll dice. Includes boolean array: which dice are not rolled
    socket.on("turn:roll", async (payload, ack) => {
      if (typeof ack !== "function") return;

      try {
        const held = payload?.held;

        // Validate input: held dice is an array of booleans of right length
        const isHeldArray =
          Array.isArray(held) &&
          held.length === DICE_COUNT &&
          held.every((item) => typeof item === "boolean");
        if (!isHeldArray) return ack({ ok: false, error: "BAD_INPUT" });

        // Read-modify-write room state inside lock (pass the fn)
        await lockRoom(roomId, async () => {
          const room = await getRoom(roomId);
          const player = room?.players.find((p) => p.id === playerId);
          if (!room || !player)
            return ack({ ok: false, error: "ROOM_NOT_FOUND" });

          const error = rollDice(room, player.id, held);
          if (error) return ack({ ok: false, error });

          await saveRoom(room);
          io.to(room.id).emit("room:state", toPublicState(room));
          ack({ ok: true });
        });
      } catch (err) {
        console.error(err);
        ack({ ok: false, error: "SERVER_ERROR" });
      }
    });

    // End turn, select scoring category
    socket.on("turn:end", async (payload, ack) => {
      if (typeof ack !== "function") return;

      try {
        // Payload includes valid category?
        const category = payload?.category;
        if (!CATEGORIES.includes(category))
          return ack({ ok: false, error: "BAD_INPUT" });

        // Read-modify-write room state inside lock (pass the fn)
        await lockRoom(roomId, async () => {
          const room = await getRoom(roomId);
          const player = room?.players.find((p) => p.id === playerId);
          if (!room || !player)
            return ack({ ok: false, error: "ROOM_NOT_FOUND" });

          const error = endTurn(room, player, category);
          if (error) return ack({ ok: false, error });

          await saveRoom(room);
          io.to(room.id).emit("room:state", toPublicState(room));
          ack({ ok: true });
        });
      } catch (err) {
        console.error(err);
        ack({ ok: false, error: "SERVER_ERROR" });
      }
    });

    // Send chat message. Messages aren't stored on server, just validated and emitted forward
    socket.on("chat:send", async (payload, ack) => {
      if (typeof ack !== "function") return;

      try {
        const text =
          typeof payload?.text === "string" ? payload.text.trim() : "";
        if (!text || text.length > MAX_MESSAGE_LENGTH)
          return ack({ ok: false, error: "BAD_INPUT" });

        const room = await getRoom(roomId);
        const player = room?.players.find((p) => p.id === playerId);
        if (!room || !player)
          return ack({ ok: false, error: "ROOM_NOT_FOUND" });

        io.to(room.id).emit("chat:message", {
          id: randomUUID(),
          playerId: player.id,
          name: player.name,
          text,
        });
        ack({ ok: true });
      } catch (err) {
        console.error(err);
        ack({ ok: false, error: "SERVER_ERROR" });
      }
    });

    // Leave room
    socket.on("room:leave", async (ack) => {
      if (typeof ack !== "function") return;

      try {
        socket.leave(roomId);
        await lockRoom(roomId, () => leaveRoom(io, roomId, playerId));
        ack();
      } catch (err) {
        console.error(err);
        ack();
      }
    });

    // ON DISCONNECT
    socket.on("disconnect", async () => {
      try {
        await lockRoom(roomId, async () => {
          const room = await getRoom(roomId);
          const player = room?.players.find((p) => p.id === playerId);
          // Ignore players who already left and sockets replaced by a newer connection
          if (!room || !player || player.socketId !== socket.id) return;

          player.socketId = null;
          await saveRoom(room);
          await updateCloseTimer(room);
          await startLeaveTimer(roomId, playerId);
          io.to(room.id).emit("room:state", toPublicState(room));
        });
      } catch (err) {
        console.error(err);
      }
    });

    // CONNECTION HANDLER
    // Last, because this uses the handlers defined above
    try {
      await lockRoom(roomId, async () => {
        // Make sure that player belongs to a room
        const room = await getRoom(roomId);
        const player = room?.players.find((p) => p.id === playerId);
        if (!room || !player) return socket.disconnect(true);

        // Dropped while waiting for lock
        if (socket.disconnected) return;

        // Duplicated tab: kick old connection, newest wins
        const previousSocketId = player.socketId;
        player.socketId = socket.id;
        await saveRoom(room);
        if (previousSocketId) io.in(previousSocketId).disconnectSockets(true);

        await cancelLeaveTimer(roomId, playerId);
        await updateCloseTimer(room);
        socket.join(room.id);
        io.to(room.id).emit("room:state", toPublicState(room));
      });
    } catch (err) {
      console.error(err);
      socket.disconnect(true);
    }
  });
}
