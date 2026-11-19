// Scoring — brief §8 (exact). P = team promise excluding go-zero players.
// W = rounds the team actually won. E = W - P when W > P.
export interface GoZero {
  attempted: boolean;
  won: number;
}

export interface DealScoreInput {
  teamPromise: number;
  teamWon: number;
  goZero: GoZero[];
  extrasBankBefore: number;
}

export interface DealScore {
  points: number;
  extrasThisDeal: number;
  extrasPenalty: number;
  extrasBankAfter: number;
  goZeroDelta: number;
  madePromise: boolean;
}

export const scoreDeal = (input: DealScoreInput): DealScore => {
  const { teamPromise, teamWon, goZero, extrasBankBefore } = input;
  const madePromise = teamWon >= teamPromise;
  const extrasThisDeal = teamWon > teamPromise ? teamWon - teamPromise : 0;
  const bankTotal = extrasBankBefore + extrasThisDeal;
  const penalties = Math.floor(bankTotal / 10);
  const extrasPenalty = penalties * 100;
  const extrasBankAfter = bankTotal % 10;
  let goZeroDelta = 0;
  for (const gz of goZero) {
    if (!gz.attempted) continue;
    goZeroDelta += gz.won === 0 ? 100 : -100;
  }
  const base = madePromise ? teamPromise * 10 + extrasThisDeal : -teamPromise * 10;
  return {
    points: base - extrasPenalty + goZeroDelta,
    extrasThisDeal,
    extrasPenalty,
    extrasBankAfter,
    goZeroDelta,
    madePromise,
  };
};

export interface GameScores {
  us: number;
  them: number;
}

/** Losing floor for a target: -200 for 500, -100 for 250. */
export const loseFloor = (target: number): number => -Math.round((target * 0.4) / 50) * 50;

/** First to `target` (500 classic, 250 quick) wins; falling to the floor
 *  loses. Both crossing the target in one deal: higher wins. */
export const gameWinner = (scores: GameScores, target = 500): 'us' | 'them' | null => {
  const floor = loseFloor(target);
  const usOut = scores.us <= floor;
  const themOut = scores.them <= floor;
  if (usOut && themOut) return scores.us > scores.them ? 'us' : 'them';
  if (usOut) return 'them';
  if (themOut) return 'us';
  if (scores.us >= target || scores.them >= target) {
    if (scores.us === scores.them) return null; // tie — one more deal
    return scores.us > scores.them ? 'us' : 'them';
  }
  return null;
};
