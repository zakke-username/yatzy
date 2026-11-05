import type { ReactNode } from "react";
import {
  LOWER_CATEGORIES,
  UPPER_CATEGORIES,
  type Category,
  type PublicPlayer,
  type Scores,
} from "../../../shared/types.ts";
import "./Scoreboard.css";

const LABELS: Record<Category, string> = {
  ones: "Ones",
  twos: "Twos",
  threes: "Threes",
  fours: "Fours",
  fives: "Fives",
  sixes: "Sixes",
  onePair: "One pair",
  twoPairs: "Two pairs",
  threeOfAKind: "Three of a kind",
  fourOfAKind: "Four of a kind",
  smallStraight: "Small straight",
  largeStraight: "Large straight",
  fullHouse: "Full house",
  chance: "Chance",
  yatzy: "Yatzy",
};

type Props = {
  players: PublicPlayer[];
  currentPlayerId: string | null;
  potentialScores: Scores | null;
};

function Scoreboard({ players, currentPlayerId, potentialScores }: Props) {
  const row = (
    label: string,
    score: (player: PublicPlayer) => ReactNode,
    className?: string,
  ) => (
    <tr key={label} className={className}>
      <th scope="row">{label}</th>
      {players.map((player) => (
        <td
          key={player.id}
          data-current={player.id === currentPlayerId}
          data-offline={!player.connected}
        >
          {score(player)}
        </td>
      ))}
    </tr>
  );

  const categoryRow = (category: Category) =>
    row(LABELS[category], (player) =>
      potentialScores && player.id === currentPlayerId ? (
        <span className="potential">{potentialScores[category]}</span>
      ) : (
        player.scores[category]
      ),
    );

  return (
    <section className="stack">
      <h2 className="label">Scoreboard</h2>
      <div className="scoreboard">
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
                >
                  {player.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {UPPER_CATEGORIES.map(categoryRow)}
            {row("Sum", (player) => player.sum, "summary")}
            {row("Bonus", (player) => player.bonus, "summary")}
            {LOWER_CATEGORIES.map(categoryRow)}
            {row("Total", (player) => player.total, "summary")}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Scoreboard;
