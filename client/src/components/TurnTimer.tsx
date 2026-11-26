import { useEffect, useState } from "react";

type Props = {
  msLeft: number; // time left in the turn when its state arrived
};

function TurnTimer({ msLeft }: Props) {
  // Deadline on this browser's clock, set once per turn (Game keys this by turn)
  const [endsAt] = useState(() => Date.now() + msLeft);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  const secondsLeft = Math.max(0, Math.ceil((endsAt - now) / 1000));

  return (
    <span
      className="min-w-16 tabular-nums md:min-w-24 md:text-xl font-semibold"
      title="Seconds left in this turn"
    >
      ⏳{secondsLeft} s
    </span>
  );
}

export default TurnTimer;
