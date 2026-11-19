import one from "../assets/dice/1.svg";
import two from "../assets/dice/2.svg";
import three from "../assets/dice/3.svg";
import four from "../assets/dice/4.svg";
import five from "../assets/dice/5.svg";
import six from "../assets/dice/6.svg";
import styles from "./Dice.module.css";

const FACES = [one, two, three, four, five, six];

type Props = {
  values: number[];
  held: boolean[];
  rolling: boolean; // "Loading" constant spin, while waiting for server
  landing: boolean[]; // Quick spin for all players when new dice arrive
  disabled: boolean;
  onToggle: (index: number) => void;
};

function Dice({ values, held, rolling, landing, disabled, onToggle }: Props) {
  return (
    <div className={styles.dice}>
      {values.map((value, index) => (
        <button
          key={index}
          type="button"
          aria-pressed={held[index]}
          disabled={disabled}
          data-spinning={rolling && !held[index]}
          data-landing={landing[index]}
          onClick={() => onToggle(index)}
          draggable="false"
        >
          <img src={FACES[value - 1]} alt={String(value)} draggable="false" />
          {held[index] && <span aria-hidden="true">🔒</span>}
        </button>
      ))}
    </div>
  );
}

export default Dice;
