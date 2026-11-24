import type { PublicRoomState } from "../../../shared/types.ts";

type Props = {
  room: PublicRoomState;
  playerId: string; // "you"
};

function PlayerList({ room, playerId }: Props) {
  return (
    <ul className="flex flex-col gap-2">
      {room.players.map((player) => {
        const isYou = player.id === playerId;
        return (
          <li
            className={`flex items-center rounded-lg border-2 p-4 ${isYou ? "border-black" : "border-gray-300"}`}
            key={player.id}
          >
            <span
              className={`flex-1 truncate ${isYou ? "font-semibold" : "font-medium"} ${player.connected ? "" : "text-gray-500"}`}
            >
              {player.name}
            </span>
            {player.id === room.hostId && (
              <span className="rounded-full bg-primary px-2 py-1 text-xs font-semibold text-white">
                HOST
              </span>
            )}
            {!player.connected && (
              <span className="mx-2 truncate text-gray-500">
                (disconnected, kicking...)
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default PlayerList;
