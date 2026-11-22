import { useState } from "react";
import LobbyInvite from "../components/LobbyInvite.tsx";
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

  async function startGame() {
    // New status arrives in room:state, and Room shows the game
    const res = await socket.emitWithAck("game:start").catch(() => undefined);
    if (res && !res.ok) setError(ERROR_MESSAGES[res.error]);
  }

  return (
    <main className={`card ${styles.window}`}>
      <LobbyInvite roomId={room.id} />
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
