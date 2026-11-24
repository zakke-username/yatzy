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
    <main className="card mx-auto my-4 flex w-[min(24rem,100%-2rem)] flex-col gap-12">
      <div className="flex flex-col items-center gap-2">
        <h1 className="my-2 text-center text-3xl">
          <b>Lobby</b>: {room.id}
        </h1>
        <button
          type="button"
          className="btn bg-yellow-50 p-2 text-sm font-medium text-black"
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
          <p className="my-2 text-center text-xl">
            Waiting for host to start...
          </p>
        )}

        <button type="button" className="btn bg-danger" onClick={onLeave}>
          Exit lobby
        </button>
      </div>
      {error && (
        <p className="fixed top-4 left-4 rounded-lg bg-danger/70 p-4 text-white">
          ⚠️ {error}
        </p>
      )}
    </main>
  );
}

export default Lobby;
