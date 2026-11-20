// Card-playing AI.
//
// Two layers:
//  1. Personality — the six stat dots (1–5) decide each choice as a chance.
//     A partner plays from their own dots (plus any item boost); opponents
//     play from balanced dots. Same dots, same tendencies, every game.
//  2. Skill — how well the seat plays the cards (Easy / Normal / Hard /
//     Expert). Opponents use the difficulty level; family partners play at
//     Normal so a partner always feels like themselves.
//
// Randomness comes only from the `rand` function passed in. The game seeds it
// per game so a game is reproducible; when omitted, rand is a constant 0.5,
// so every chance resolves the "median" way (p > 0.5 → yes) — fully
// deterministic, used by the tutorial and tests.
import { cardBeats, legalCards, newDeck, roundWinner, type Card, type Play, type Suit } from './cards';
import { PARTNERS, type Stats } from '../constants/partners';
import { type Difficulty } from '../constants/difficulty';

export type Skill = Difficulty;
export type Rand = () => number;

export interface AiPlayer {
  traits: Stats;
  skill: Skill;
}

/** Opponents' personality: middle-of-the-road, never undercut their partner. */
export const BALANCED: Stats = { bidsBig: 3, savesSpades: 3, wontSteal: 5, avoidsExtras: 3, lovesZero: 2, leadsStrong: 3 };
/** Easy opponents also trip over their own partner now and then. */
const BALANCED_EASY: Stats = { ...BALANCED, wontSteal: 3 };

export const opponentPlayer = (skill: Skill): AiPlayer => ({ traits: skill === 'easy' ? BALANCED_EASY : BALANCED, skill });

/** Accepts an AiPlayer or a legacy id ('balanced' or a partner id). */
const resolve = (who: AiPlayer | string): AiPlayer => {
  if (typeof who !== 'string') return who;
  const p = PARTNERS.find((x) => x.id === who);
  return { traits: p ? p.stats : BALANCED, skill: 'normal' };
};

const MEDIAN: Rand = () => 0.5;
const chance = (p: number, rand: Rand) => rand() < p;
/** 1..5 dot value → 0..1. */
const u = (dots: number) => (Math.max(1, Math.min(5, dots)) - 1) / 4;

/** Small seeded PRNG (mulberry32). */
export const makeRand = (seed: number): Rand => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export interface AiContext {
  hand: Card[];
  ledSuit: Suit | null;
  plays: Play[];
  spadesBroken: boolean;
  mySeat: number;
  partnerSeat: number;
  /** Current winner of the round so far (null when leading). */
  currentWinnerSeat: number | null;
  goingZero: boolean;
  /** Team has already won at least its promise this deal. */
  teamMadePromise: boolean;
  /** Rounds left in this deal including this one. */
  roundsLeft: number;
  /** Every card played earlier this deal (not counting `plays`). For card counting. */
  played?: Card[];
  /** My partner promised zero and hasn't won a round yet. */
  partnerGoingZero?: boolean;
  /** Seats on the other team still on track for a go-zero (Expert hunts them). */
  zeroTargets?: number[];
}

export interface AiChoice {
  card: Card;
  /** True when the card played is the lowest card in the hand. */
  ledLow: boolean;
  /** True when the card takes a round the partner already had covered. */
  stole: boolean;
}

const lowest = (cards: Card[]): Card => [...cards].sort((a, b) => a.rank - b.rank)[0];
const highest = (cards: Card[]): Card => [...cards].sort((a, b) => b.rank - a.rank)[0];
const same = (a: Card, b: Card) => a.suit === b.suit && a.rank === b.rank;

const winnerIndex = (plays: Play[]): number => {
  const led = plays[0].card.suit;
  let best = 0;
  for (let i = 1; i < plays.length; i++) if (cardBeats(plays[i].card, plays[best].card, led)) best = i;
  return best;
};
const winningCards = (legal: Card[], plays: Play[]): Card[] => {
  if (plays.length === 0) return legal;
  const led = plays[0].card.suit;
  const cur = plays[winnerIndex(plays)].card;
  return legal.filter((c) => cardBeats(c, cur, led));
};
const losingCards = (legal: Card[], plays: Play[]): Card[] => {
  const wins = winningCards(legal, plays);
  return legal.filter((c) => !wins.some((w) => same(w, c)));
};

/** Cards still unseen by this seat (not in my hand, not played). */
const unseen = (hand: Card[], played: Card[]): Card[] =>
  newDeck().filter((c) => !hand.some((h) => same(h, c)) && !played.some((p) => same(p, c)));

/** A "boss" card is the highest card left in its suit — it wins if followed. */
const isBoss = (card: Card, hand: Card[], played: Card[]): boolean =>
  !unseen(hand, played).some((c) => c.suit === card.suit && c.rank > card.rank);

// ───────────────────────────── Promise

/** Likely winners. Normal: aces + high spades (+1 for 5+ spades). Hard+: also guarded kings and long spades. */
export const estimateFor = (hand: Card[], skill: Skill): number => {
  let n = 0;
  const bySuit = (s: Suit) => hand.filter((c) => c.suit === s);
  for (const c of hand) {
    if (c.rank === 14) n += 1;
    else if (c.suit === 'S' && c.rank >= 12) n += 1;
  }
  const spades = bySuit('S').length;
  if (spades >= 5) n += 1;
  if (skill === 'hard' || skill === 'expert') {
    for (const s of ['H', 'D', 'C'] as Suit[]) {
      const cards = bySuit(s);
      if (cards.some((c) => c.rank === 13) && cards.length >= 2 && cards.length <= 5) n += 0.5;
    }
    if (spades >= 7) n += 1;
  }
  return Math.min(13, Math.round(n));
};

/** Promise for an AI seat. 0 = go zero. */
export const choosePromise = (hand: Card[], who: AiPlayer | string, rand: Rand = MEDIAN): number => {
  const { traits, skill } = resolve(who);
  const est = estimateFor(hand, skill);
  const clamp = (n: number) => Math.max(1, Math.min(13, n));

  // Loves Going Zero: the more dots, the stronger a hand they'll go zero on.
  const zeroMax = [-1, 0, 1, 2, 2][traits.lovesZero - 1];
  const zeroChance = [0, 0.35, 0.5, 0.75, 1][traits.lovesZero - 1];
  const spades = hand.filter((c) => c.suit === 'S');
  const safeForZero = !spades.some((c) => c.rank >= 13) && spades.length <= 3;
  if (est <= zeroMax && safeForZero && chance(zeroChance, rand)) return 0;

  // Bids Big: 1 dot → promise 1 under, 3 → exact, 5 → 1 over. Half-steps by chance.
  const offset = (traits.bidsBig - 3) / 2;
  let promise = est + Math.trunc(offset);
  const frac = Math.abs(offset % 1);
  if (frac > 0 && chance(frac, rand)) promise += Math.sign(offset);

  // Easy seats misjudge their hand.
  if (skill === 'easy' && chance(0.5, rand)) promise += chance(0.5, rand) ? 1 : -1;
  return clamp(promise);
};

// ───────────────────────────── Play

const chooseLead = (p: AiPlayer, ctx: AiContext, legal: Card[], rand: Rand): Card => {
  const { traits, skill } = p;
  const played = ctx.played ?? [];
  const smart = skill === 'hard' || skill === 'expert';
  const spades = legal.filter((c) => c.suit === 'S');
  const nonSpades = legal.filter((c) => c.suit !== 'S');
  const side = nonSpades.length > 0 ? nonSpades : legal;

  // Expert: an opponent is going zero — lead low to make them take a round.
  if (skill === 'expert' && (ctx.zeroTargets?.length ?? 0) > 0) return lowest(side);
  // Team already made its promise and this seat avoids extras: lead low.
  if (ctx.teamMadePromise && chance(u(traits.avoidsExtras), rand)) return lowest(legal);

  // Low Saves Spades → leads spades as soon as they're allowed.
  if (spades.length > 0 && chance(1 - u(traits.savesSpades), rand)) return highest(spades);

  // Hard+: cash a sure winner first.
  if (smart) {
    const bosses = side.filter((c) => isBoss(c, ctx.hand, played));
    if (bosses.length > 0 && chance(0.5 + u(traits.leadsStrong) / 2, rand)) return highest(bosses);
  }
  // Leads Strong → high card, otherwise low.
  if (chance(u(traits.leadsStrong), rand)) return highest(side);
  if (smart) {
    // Lead low from the longest side suit (keeps short suits for trumping later).
    const bySuit = (s: Suit) => side.filter((c) => c.suit === s);
    const longest = (['H', 'D', 'C', 'S'] as Suit[]).map(bySuit).sort((a, b) => b.length - a.length)[0];
    if (longest.length > 0) return lowest(longest);
  }
  return lowest(side);
};

const chooseFollow = (p: AiPlayer, ctx: AiContext, legal: Card[], rand: Rand): Card => {
  const { traits, skill } = p;
  const played = ctx.played ?? [];
  const smart = skill === 'hard' || skill === 'expert';
  const ledSuit = ctx.ledSuit as Suit;
  const wins = winningCards(legal, ctx.plays);
  const loses = losingCards(legal, ctx.plays);
  const lowestWin = wins.length > 0 ? lowest(wins) : null;
  // Easy seats throw away their biggest losing card; better seats keep it.
  const discard = loses.length > 0 ? (skill === 'easy' ? highest(loses) : lowest(loses)) : lowest(legal);
  const partnerWinning = ctx.currentWinnerSeat === ctx.partnerSeat;
  const last = ctx.plays.length === 3;
  const hasLed = ctx.hand.some((c) => c.suit === ledSuit);

  // Going zero: highest card that still loses, else the lowest card.
  if (ctx.goingZero) return loses.length > 0 ? highest(loses) : lowest(legal);

  // Hard+: partner went zero and is winning this round — take it off them.
  if (smart && ctx.partnerGoingZero && partnerWinning && lowestWin) return lowestWin;

  // Expert: a go-zero opponent is winning this round — leave it with them.
  if (skill === 'expert' && ctx.currentWinnerSeat !== null && ctx.zeroTargets?.includes(ctx.currentWinnerSeat)) {
    return loses.length > 0 ? highest(loses) : lowest(legal);
  }

  // Avoids Extras: team promise made → duck.
  if (ctx.teamMadePromise && chance(u(traits.avoidsExtras), rand)) return discard;

  // Won't Steal Your Win: partner has it covered → usually play low.
  if (partnerWinning) {
    if (lowestWin && chance(1 - u(traits.wontSteal), rand)) return lowestWin;
    return discard;
  }

  if (!lowestWin) return discard;

  // Out of the led suit: winning means trumping. Saves Spades → often holds them back.
  if (!hasLed && lowestWin.suit === 'S' && ledSuit !== 'S') {
    const trump = chance(1 - 0.8 * u(traits.savesSpades), rand) || (smart && last);
    return trump ? lowestWin : discard;
  }

  // Hard+: second to play, can't win for sure → keep the big card for later.
  if (smart && ctx.plays.length === 1 && !isBoss(lowestWin, ctx.hand, played) && loses.length > 0) return lowest(loses);

  return lowestWin;
};

export const chooseCard = (who: AiPlayer | string, ctx: AiContext, rand: Rand = MEDIAN): AiChoice => {
  const p = resolve(who);
  const legal = legalCards(ctx.hand, ctx.ledSuit, ctx.spadesBroken);
  const leading = ctx.ledSuit === null || ctx.plays.length === 0;
  let card: Card;
  if (p.skill === 'easy' && !ctx.goingZero && chance(0.25, rand)) {
    // Easy: a quarter of plays are a careless pick.
    card = legal[Math.floor(rand() * legal.length) % legal.length];
  } else if (leading) {
    card = ctx.goingZero ? lowest(legal) : chooseLead(p, ctx, legal, rand);
  } else {
    card = chooseFollow(p, ctx, legal, rand);
  }
  const ledLow = ctx.hand.every((c) => c.rank >= card.rank);
  const stole =
    ctx.currentWinnerSeat === ctx.partnerSeat &&
    ctx.plays.length > 0 &&
    roundWinner([...ctx.plays, { seat: ctx.mySeat, card }]) === ctx.mySeat;
  return { card, ledLow, stole };
};

/** Human hint for the promise picker: a plain count of likely winners. */
export const likelyWinnersHint = (hand: Card[]): number => estimateFor(hand, 'normal');
