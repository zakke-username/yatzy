import {
  LOWER_CATEGORIES,
  UPPER_CATEGORIES,
  type Category,
  type PublicPlayer,
  type Scores,
} from "../../../shared/types.ts";

// The scorecard's rows, top to bottom
const ROWS = [
  ...UPPER_CATEGORIES,
  "sum",
  "bonus",
  ...LOWER_CATEGORIES,
  "total",
] as const;
type Row = (typeof ROWS)[number];

const LABELS: Record<Row, string> = {
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

// The rows worked out from the scores
function isSummary(row: Row | undefined) {
  return row === "sum" || row === "bonus" || row === "total";
}

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
    <section className="card p-4 max-w-[calc(100%-2rem)]">
      <div className="overflow-x-auto">
        <table className="w-max border-separate border-spacing-0 tabular-nums">
          <thead>
            <tr>
              <td className="sticky left-0 border-r-2 border-b-2 border-black bg-white" />
              {players.map((player) => {
                const isCurrent = player.id === currentPlayerId;
                return (
                  <th
                    key={player.id}
                    className={`border-r border-b-2 border-r-gray-300 border-b-black last:border-r-0 ${isCurrent ? "bg-primary" : ""} ${!player.connected ? "text-gray-400" : isCurrent ? "text-white" : ""}`}
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
              const summary = isSummary(row);
              // Thick lines around the summary rows, thin ones between categories, none under the last row
              const nextRow = ROWS[i + 1];
              const bottom = !nextRow
                ? ""
                : summary || isSummary(nextRow)
                  ? "border-b-2 border-b-black"
                  : "border-b border-b-gray-300";
              return (
                <tr key={row} className="leading-loose md:leading-6.5">
                  <th
                    className={`sticky left-0 border-r-2 border-r-black bg-white px-2 text-left ${bottom} ${summary ? "font-semibold" : "font-normal"}`}
                    scope="row"
                  >
                    {LABELS[row]}
                  </th>
                  {players.map((player) => {
                    const score = summary ? player[row] : player.scores[row];
                    // The current player's empty categories show what their dice would score, as a button that scores it
                    const showPotential =
                      !summary &&
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
                            className="block w-full rounded-sm text-primary outline-2 -outline-offset-3 outline-green-600 hover:cursor-pointer hover:font-semibold hover:outline-3 hover:-outline-offset-4 hover:outline-primary"
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
