import { useEffect, useState } from "react";
import rollSoundUrl from "../assets/dice-roll.wav";
import one from "../assets/dice/1.svg";
import two from "../assets/dice/2.svg";
import three from "../assets/dice/3.svg";
import four from "../assets/dice/4.svg";
import five from "../assets/dice/5.svg";
import six from "../assets/dice/6.svg";
import {
  DICE_COUNT,
  ROLLS_PER_TURN,
  type PublicRoomState,
} from "../../../shared/types.ts";

const FACES = [one, two, three, four, five, six];
const NONE_HELD = Array<boolean>(DICE_COUNT).fill(false);
const ROLL_SOUND = new Audio(rollSoundUrl);
ROLL_SOUND.volume = 0.5;

type Props = {
  room: PublicRoomState;
  isMyTurn: boolean;
  busy: boolean; // A request is waiting for the server's answer
  onRoll: (held: boolean[]) => Promise<void>;
};

// The dice and the Roll button
// Game keys this by turn, so every turn starts with no dice held
function Dice({ room, isMyTurn, busy, onRoll }: Props) {
  const [held, setHeld] = useState(NONE_HELD);
  const [rolling, setRolling] = useState(false);
  const hasRolled = room.rollsLeft < ROLLS_PER_TURN;

  // Roll sound for other players (the roller's plays on click)
  useEffect(() => {
    if (!isMyTurn && room.rollsLeft < ROLLS_PER_TURN) {
      ROLL_SOUND.currentTime = 0;
      ROLL_SOUND.play().catch(() => {});
    }
  }, [room.rollsLeft, isMyTurn]);

  function toggleHeld(index: number) {
    setHeld(held.map((isHeld, i) => (i === index ? !isHeld : isHeld)));
  }

  async function roll() {
    ROLL_SOUND.currentTime = 0;
    ROLL_SOUND.play().catch(() => {});
    setRolling(true);
    await onRoll(held);
    setRolling(false);
  }

  return (
    <div className="card sticky bottom-4 flex flex-col items-center gap-4 p-4 md:flex-row md:gap-6">
      {/* A roll always changes rollsLeft, so the new key rebuilds the dice and replays their landing spin */}
      <div key={room.rollsLeft} className="flex gap-3">
        {room.dice.map((value, index) => (
          <button
            className="relative w-12 transition-[scale] duration-100 ease-out select-none enabled:hover:scale-110 enabled:hover:cursor-pointer data-[spinning=true]:animate-dice-spin"
            data-spinning={rolling && !held[index]} // Constant "loading" spin
            key={index}
            type="button"
            aria-pressed={held[index]}
            disabled={busy || !isMyTurn || !hasRolled || room.rollsLeft === 0}
            onClick={() => toggleHeld(index)}
            draggable="false"
          >
            <img
              className="data-[landing=true]:animate-dice-land"
              data-landing={hasRolled && !room.held[index]}
              src={FACES[value - 1]}
              alt={String(value)}
              draggable="false"
            />
            {held[index] && room.rollsLeft > 0 && (
              <span
                className="absolute -top-4 -right-2.5 z-2 text-2xl text-shadow-[2px_2px_black]"
                aria-hidden="true"
              >
                🔒
              </span>
            )}
          </button>
        ))}
      </div>
      {isMyTurn && (
        <button
          type="button"
          className={`btn w-72 md:w-32 ${hasRolled ? "" : "animate-pulse-outline outline-6 outline-yellow-400"}`}
          disabled={
            busy || room.rollsLeft === 0 || held.every((isHeld) => isHeld)
          }
          onClick={roll}
        >
          Roll ({room.rollsLeft}/{ROLLS_PER_TURN})
        </button>
      )}
    </div>
  );
}

export default Dice;
