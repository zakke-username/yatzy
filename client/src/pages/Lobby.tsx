import { useState } from "react";
import PlayerList from "../components/PlayerList.tsx";
import { ERROR_MESSAGES } from "../lib/api.ts";
import { socket } from "../lib/socket.ts";
import type { PublicRoomState } from "../../../shared/types.ts";

type Props = {
  room: PublicRoomState;
  playerId: string; // you
  onLeave: () => void;
};

function Lobby({ room, playerId, onLeave }: Props) {
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/${room.id}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function startGame() {
    // New status arrives in room:state, and Room shows the game
    const res = await socket.emitWithAck("game:start").catch(() => undefined);
    if (res && !res.ok) setError(ERROR_MESSAGES[res.error]);
  }

  return (
    <main className="card m-auto p-8 max-w-[min(32rem,100%-2rem)] flex flex-col justify-center gap-12">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl sm:text-4xl text-center m-4">
          <b>Lobby</b>: {room.id}
        </h1>
        <button
          type="button"
          className="btn p-2 text-black font-medium text-sm bg-yellow-100"
          onClick={copyLink}
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
      <PlayerList room={room} playerId={playerId} />

      <div className="flex flex-col gap-4">
        {room.hostId === playerId ? (
          <button type="button" className="btn" onClick={startGame}>
            Start game
          </button>
        ) : (
          <p className="text-xl text-center my-2">
            Waiting for host to start...
          </p>
        )}
        {error && <p className="error">{error}</p>}

        <button type="button" className="btn bg-red-500" onClick={onLeave}>
          Exit lobby
        </button>
      </div>
    </main>
  );
}

export default Lobby;
