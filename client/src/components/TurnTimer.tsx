import { useEffect, useState } from "react";
import styles from "./TurnTimer.module.css";

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
    <span className={styles.timer} title="Seconds left in this turn">
      ⏳{secondsLeft} s
    </span>
  );
}

export default TurnTimer;
