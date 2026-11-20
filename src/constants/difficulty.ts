// Difficulty — how well the two opponents play, and what a win pays.
// Your rank sets the minimum level (it rises as you rank up); in Settings you
// can choose to play harder than that for more Coins, never easier.

export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert';

export interface DifficultyDef {
  id: Difficulty;
  name: string;
  /** Coins for winning a game at this level (losing always pays LOSS_COINS). */
  winCoins: number;
  /** Rank at which this becomes the minimum level. */
  fromRank: number;
  /** One line on how the opponents play. */
  blurb: string;
}

export const DIFFICULTIES: DifficultyDef[] = [
  { id: 'easy', name: 'Easy', winCoins: 20, fromRank: 1, blurb: 'They misjudge promises and waste their big cards.' },
  { id: 'normal', name: 'Normal', winCoins: 30, fromRank: 5, blurb: 'Solid play: they win cheaply and cover each other.' },
  { id: 'hard', name: 'Hard', winCoins: 45, fromRank: 10, blurb: 'They count cards, lead winners and play second-hand low.' },
  { id: 'expert', name: 'Expert', winCoins: 60, fromRank: 15, blurb: 'Hard, plus they hunt your go-zero and feed you extras.' },
];

const ORDER: Difficulty[] = DIFFICULTIES.map((d) => d.id);

export const difficultyDef = (id: Difficulty): DifficultyDef => DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[0];

/** Lowest level your rank allows. Easy 1–4, Normal 5–9, Hard 10–14, Expert 15+. */
export const minDifficultyForRank = (rank: number): Difficulty =>
  [...DIFFICULTIES].reverse().find((d) => rank >= d.fromRank)?.id ?? 'easy';

/** The level you actually play: your choice, but never below your rank's minimum. */
export const effectiveDifficulty = (chosen: Difficulty, rank: number): Difficulty => {
  const floor = minDifficultyForRank(rank);
  return ORDER.indexOf(chosen) >= ORDER.indexOf(floor) ? chosen : floor;
};

export const isBelow = (a: Difficulty, b: Difficulty): boolean => ORDER.indexOf(a) < ORDER.indexOf(b);
