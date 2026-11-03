import { CATEGORIES, type Category, type PublicPlayer } from "../types.ts";
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
};

function Scoreboard({ players }: Props) {
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
                  data-offline={!player.connected}
                >
                  {player.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((category) => (
              <tr key={category}>
                <th scope="row">{LABELS[category]}</th>
                {players.map((player) => (
                  <td key={player.id} data-offline={!player.connected}>
                    {player.scores[category]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Scoreboard;
