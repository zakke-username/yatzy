import {
  LOWER_CATEGORIES,
  UPPER_CATEGORIES,
  type Category,
  type PublicPlayer,
  type Scores,
} from "../../../shared/types.ts";
import "./Scoreboard.css";

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
  isMyTurn: boolean;
  potentialScores: Scores | null;
  disabled: boolean;
  onScore: (category: Category) => void;
};

function Scoreboard({
  players,
  currentPlayerId,
  isMyTurn,
  potentialScores,
  disabled,
  onScore,
}: Props) {
  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  return (
    <section className="container stack scoreboard">
      <h2
        className="turn-info"
        data-my-turn={isMyTurn}
        data-connected={currentPlayer?.connected}
      >
        {currentPlayer?.connected ? (
          <>{isMyTurn ? <>Your turn!</> : <>{currentPlayer?.name}'s turn</>}</>
        ) : (
          <>{currentPlayer?.name} has disconnected: kicking in 30 s...</>
        )}
      </h2>

      <div className="scoreboard-scroll">
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
                  {/* Spread splits by character rather than UTF-16 unit, so an emoji isn't cut in half */}
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
                <tr key={row} className={isSummary ? "summary" : undefined}>
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
                            className="potential"
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
