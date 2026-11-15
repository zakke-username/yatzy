import {
  LOWER_CATEGORIES,
  UPPER_CATEGORIES,
  type Category,
  type PublicPlayer,
  type Scores,
} from "../../../shared/types.ts";
import styles from "./Scoreboard.module.css";

// The scorecard's rows, top to bottom
const ROWS = [
  ...UPPER_CATEGORIES,
  "sum",
  "bonus",
  ...LOWER_CATEGORIES,
  "total",
] as const;

const LABELS: Record<(typeof ROWS)[number], string> = {
  ones: "Ones",
  twos: "Twos",
  threes: "Threes",
  fours: "Fours",
  fives: "Fives",
  sixes: "Sixes",
  sum: "Sum",
  bonus: "Bonus",
  onePair: "One pair",
  twoPairs: "Two pairs",
  threeOfAKind: "Three of a kind",
  fourOfAKind: "Four of a kind",
  smallStraight: "Small straight",
  largeStraight: "Large straight",
  fullHouse: "Full house",
  chance: "Chance",
  yatzy: "Yatzy",
  total: "Total",
};

type Props = {
  players: PublicPlayer[];
  currentPlayerId: string | null;
  potentialScores: Scores | null;
  disabled: boolean;
  onScore: (category: Category) => void;
};

function Scoreboard({
  players,
  currentPlayerId,
  potentialScores,
  disabled,
  onScore,
}: Props) {
  return (
    <section className={`card ${styles.scoreboard}`}>
      <div className={styles.scroll}>
        <table>
          <thead>
            <tr>
              <td />
              {players.map((player) => (
                <th
                  key={player.id}
                  scope="col"
                  data-current={player.id === currentPlayerId}
                  data-offline={!player.connected}
                  title={player.name}
                >
                  {[...player.name].slice(0, 3).join("")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const isSummary =
                row === "sum" || row === "bonus" || row === "total";
              return (
                <tr
                  key={row}
                  className={isSummary ? styles.summary : undefined}
                >
                  <th scope="row">{LABELS[row]}</th>
                  {players.map((player) => {
                    const score = isSummary ? player[row] : player.scores[row];
                    // The current player's empty categories show what their dice would score, as a button that scores it
                    const showPotential =
                      !isSummary &&
                      score === null &&
                      potentialScores &&
                      player.id === currentPlayerId;
                    return (
                      <td
                        key={player.id}
                        data-current={player.id === currentPlayerId}
                        data-offline={!player.connected}
                      >
                        {showPotential ? (
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onScore(row)}
                          >
                            {potentialScores[row]}
                          </button>
                        ) : (
                          score
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Scoreboard;
