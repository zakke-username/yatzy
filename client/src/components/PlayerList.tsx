import type { PublicRoomState } from "../../../shared/types.ts";

type Props = {
  room: PublicRoomState;
  playerId: string; // "you"
};

function PlayerList({ room, playerId }: Props) {
  return (
    <ul className="flex flex-col gap-2">
      {room.players.map((player) => (
        <li
          className={`flex items-center border-2 p-4 rounded-lg ${player.id === playerId ? "border-black" : "border-gray-300"}`}
          key={player.id}
        >
          <span
            className={`flex-1 truncate ${player.id === playerId ? "font-semibold" : "font-medium"} ${!player.connected && "text-gray-500"}`}
          >
            {player.name}
          </span>
          {player.id === room.hostId && (
            <span className="bg-primary rounded-full px-2 py-1 text-xs text-white font-semibold">
              HOST
            </span>
          )}
          {!player.connected && (
            <span className="text-gray-500 mx-2 truncate">
              (disconnected, kicking...)
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default PlayerList;
