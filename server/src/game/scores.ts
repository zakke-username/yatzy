import {
  LOWER_CATEGORIES,
  UPPER_CATEGORIES,
  type Category,
  type Scores,
} from "../../../shared/types.ts";

const FACES = [1, 2, 3, 4, 5, 6];
const BONUS_THRESHOLD = 63;
const BONUS = 50;

export function calculateScores(dice: number[]): Scores {
  const sorted = dice.toSorted().join("");

  return {
    ones: sumOfFace(dice, 1),
    twos: sumOfFace(dice, 2),
    threes: sumOfFace(dice, 3),
    fours: sumOfFace(dice, 4),
    fives: sumOfFace(dice, 5),
    sixes: sumOfFace(dice, 6),
    onePair: ofAKind(dice, 2),
    twoPairs: twoPairs(dice),
    threeOfAKind: ofAKind(dice, 3),
    fourOfAKind: ofAKind(dice, 4),
    smallStraight: sorted === "12345" ? 15 : 0,
    largeStraight: sorted === "23456" ? 20 : 0,
    fullHouse: fullHouse(dice),
    chance: sum(dice),
    yatzy: dice.every((value) => value === dice[0]) ? 50 : 0,
  };
}

// Calculate upper section sum and total
export function totals(scores: Scores) {
  const add = (categories: readonly Category[]) =>
    categories.reduce((sum, category) => sum + (scores[category] ?? 0), 0);
  const sum = add(UPPER_CATEGORIES);
  const bonus = sum >= BONUS_THRESHOLD ? BONUS : 0;
  return { sum, bonus, total: sum + bonus + add(LOWER_CATEGORIES) };
}

function count(dice: number[], face: number) {
  return dice.filter((value) => value === face).length;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function sumOfFace(dice: number[], face: number) {
  return count(dice, face) * face;
}

function ofAKind(dice: number[], n: number) {
  for (let face = 6; face >= 1; face--) {
    if (count(dice, face) >= n) return face * n;
  }
  return 0;
}

function twoPairs(dice: number[]) {
  const pairs = FACES.filter((face) => count(dice, face) >= 2);
  return pairs.length === 2 ? sum(pairs) * 2 : 0;
}

function fullHouse(dice: number[]) {
  const counts = FACES.map((face) => count(dice, face));
  return counts.includes(3) && counts.includes(2) ? sum(dice) : 0;
}
