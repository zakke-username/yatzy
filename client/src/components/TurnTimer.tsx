import { useEffect, useState } from "react";

type Props = {
  endsAt: number;
};

function TurnTimer({ endsAt }: Props) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  const secondsLeft = Math.max(0, Math.ceil((endsAt - now) / 1000));

  return (
    <span
      className="min-w-16 md:text-xl md:min-w-24"
      title="Seconds left in this turn"
    >
      ⏳{secondsLeft} s
    </span>
  );
}

export default TurnTimer;
