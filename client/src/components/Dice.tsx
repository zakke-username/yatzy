import one from "../assets/dice/1.svg";
import two from "../assets/dice/2.svg";
import three from "../assets/dice/3.svg";
import four from "../assets/dice/4.svg";
import five from "../assets/dice/5.svg";
import six from "../assets/dice/6.svg";
import "./Dice.css";

const FACES = [one, two, three, four, five, six];

type Props = {
  values: number[];
  held: boolean[];
  /** The roller's roll is in flight: the dice that aren't held spin until the server answers */
  rolling: boolean;
  /** The dice the latest roll rerolled, which spin to a stop when they appear */
  landing: boolean[];
  disabled: boolean;
  onToggle: (index: number) => void;
};

function Dice({ values, held, rolling, landing, disabled, onToggle }: Props) {
  return (
    <div className="dice">
      {values.map((value, index) => (
        <button
          key={index}
          type="button"
          className="die"
          aria-pressed={held[index]}
          disabled={disabled}
          data-spinning={rolling && !held[index]}
          data-landing={landing[index]}
          onClick={() => onToggle(index)}
          draggable="false"
        >
          <img
            className="die-face"
            src={FACES[value - 1]}
            alt={String(value)}
            draggable="false"
          />
          {held[index] && (
            <span className="die-lock" aria-hidden="true">
              🔒
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default Dice;
