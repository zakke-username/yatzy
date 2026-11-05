import "./Dice.css";

type Props = {
  values: number[];
  held: boolean[];
  disabled: boolean;
  onToggle: (index: number) => void;
};

function Dice({ values, held, disabled, onToggle }: Props) {
  return (
    <div className="dice">
      {held.map((isHeld, index) => (
        <button
          key={index}
          type="button"
          className="die"
          aria-pressed={isHeld}
          disabled={disabled}
          onClick={() => onToggle(index)}
        >
          {values[index]}
          {isHeld && (
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
