import type { PublicRoomState } from "../../../shared/types.ts";
import styles from "./PlayerList.module.css";

type Props = {
  room: PublicRoomState;
  playerId: string; // "you"
};

function PlayerList({ room, playerId }: Props) {
  return (
    <ul className={styles.players}>
      {room.players.map((player) => (
        <li
          key={player.id}
          data-host={player.id === room.hostId}
          data-offline={!player.connected}
        >
          <span className={styles.name}>
            {player.name}
            {player.id === playerId && <span className="muted"> (you)</span>}
          </span>
          {player.id === room.hostId && (
            <span className={styles.badge}>Host</span>
          )}
          {!player.connected && (
            <span className="muted">(disconnected: kicking within 30 s)</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default PlayerList;
