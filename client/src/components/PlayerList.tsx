import type { PublicLobbyState } from "../types.ts";
import "./PlayerList.css";

type Props = {
  lobby: PublicLobbyState;
  /** The viewing player, marked "(you)" */
  playerId: string;
};

function PlayerList({ lobby, playerId }: Props) {
  return (
    <section className="stack">
      <h2 className="label">
        Players {lobby.players.length}/{lobby.maxPlayers}
      </h2>
      <ul className="players">
        {lobby.players.map((player) => (
          <li
            key={player.id}
            className="player"
            data-host={player.id === lobby.hostId}
            data-offline={!player.connected}
          >
            <span className="player-name">
              {player.name}
              {player.id === playerId && <span className="muted"> (you)</span>}
            </span>
            {player.id === lobby.hostId && <span className="badge">Host</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default PlayerList;
