import {
  LOWER_CATEGORIES,
  UPPER_CATEGORIES,
  type Category,
  type PublicPlayer,
  type Scores,
} from "../../../shared/types.ts";
// import styles from "./Scoreboard.module.css";

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

function zeroToDash(score: number | null): string {
  if (score === null) return "";
  return score > 0 ? score.toString() : "-";
}

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
    <section className="card m-auto mt-16 mb-52 max-w-[calc(100%-2rem)] md:mb-24">
      <div className="overflow-x-auto">
        <table className="w-max border-separate border-spacing-0">
          <thead>
            <tr>
              <td className="sticky left-0 border-r-2 border-b-2 border-black bg-white" />
              {players.map((player) => {
                const isCurrent = player.id === currentPlayerId;
                return (
                  <th
                    key={player.id}
                    className={`border-r border-b-2 border-r-gray-300 border-b-black last:border-r-0 ${isCurrent ? "bg-green-700" : ""} ${!player.connected ? "text-gray-400" : isCurrent ? "text-white" : ""}`}
                    scope="col"
                    title={player.name}
                  >
                    {[...player.name].slice(0, 3).join("")}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => {
              const isSummary =
                row === "sum" || row === "bonus" || row === "total";
              const nextRow = ROWS[i + 1];
              const bottom = !nextRow
                ? ""
                : isSummary ||
                    nextRow === "sum" ||
                    nextRow === "bonus" ||
                    nextRow === "total"
                  ? "border-b-2 border-b-black"
                  : "border-b border-b-gray-300";
              return (
                <tr key={row} className="leading-relaxed">
                  <th
                    className={`sticky left-0 border-r-2 border-r-black bg-white px-2 text-left ${bottom} ${isSummary ? "font-bold" : "font-medium"}`}
                    scope="row"
                  >
                    {LABELS[row]}
                  </th>
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
                        className={`w-12 border-r border-r-gray-300 text-center last:border-r-0 ${bottom} ${player.id === currentPlayerId ? "bg-gray-100" : ""} ${player.connected ? "" : "text-gray-400"}`}
                        key={player.id}
                      >
                        {showPotential ? (
                          <button
                            className="block w-full text-green-700 hover:font-semibold outline-green-600 hover:outline-green-700 outline-2 -outline-offset-3 rounded-sm hover:cursor-pointer"
                            type="button"
                            disabled={disabled}
                            onClick={() => onScore(row)}
                          >
                            {zeroToDash(potentialScores[row])}
                          </button>
                        ) : (
                          zeroToDash(score)
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
