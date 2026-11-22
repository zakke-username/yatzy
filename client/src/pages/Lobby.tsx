import { useState } from "react";
import PlayerList from "../components/PlayerList.tsx";
import { ERROR_MESSAGES } from "../lib/api.ts";
import { socket } from "../lib/socket.ts";
import type { PublicRoomState } from "../../../shared/types.ts";
import styles from "./Lobby.module.css";

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
    <main className={`card ${styles.window}`}>
      <div className={styles.invite}>
        <p>
          <b>Lobby</b>: {room.id}
        </p>
        <button type="button" className="button" onClick={copyLink}>
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
      <hr />
      <PlayerList room={room} playerId={playerId} />
      <hr />

      {room.hostId === playerId ? (
        <button type="button" className="button" onClick={startGame}>
          Start game
        </button>
      ) : (
        <p className={styles.waiting}>Waiting for host to start the game…</p>
      )}
      {error && <p className="error">{error}</p>}

      <button
        type="button"
        className={`button ${styles.exit}`}
        onClick={onLeave}
      >
        Exit lobby
      </button>
    </main>
  );
}

export default Lobby;
