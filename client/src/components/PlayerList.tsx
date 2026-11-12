import type { PublicRoomState } from "../../../shared/types.ts";
import "./PlayerList.css";

type Props = {
  room: PublicRoomState;
  playerId: string; // "you"
};

function PlayerList({ room, playerId }: Props) {
  return (
    <section className="stack">
      <ul className="players">
        {room.players.map((player) => (
          <li
            key={player.id}
            className="player"
            data-host={player.id === room.hostId}
            data-offline={!player.connected}
          >
            <span className="player-name">
              {player.name}
              {player.id === playerId && <span className="muted"> (you)</span>}
            </span>
            {player.id === room.hostId && <span className="badge">Host</span>}
            {!player.connected && (
              <span className="muted">(disconnected: kicking within 30 s)</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default PlayerList;
