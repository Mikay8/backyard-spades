// Partner AI — brief §9. Quirks are DETERMINISTIC rules, not luck rolls.
// No randomness anywhere in this file: same hand + same table = same play.
import { cardBeats, estimateWinners, legalCards, roundWinner, type Card, type Play } from './cards';
import { partnerById } from '../constants/partners';

export type PartnerId = string;

export interface AiContext {
  hand: Card[];
  ledSuit: 'S' | 'H' | 'D' | 'C' | null;
  plays: Play[];
  spadesBroken: boolean;
  mySeat: number;
  partnerSeat: number;
  /** Current winner of the round so far (null when leading). */
  currentWinnerSeat: number | null;
  goingZero: boolean;
  /** Team has already won at least its promise this deal. */
  teamMadePromise: boolean;
  /** Rounds left in this deal after this card (for ducking decisions). */
  roundsLeft: number;
}

export interface AiChoice {
  card: Card;
  /** True when the card played is the lowest card in the hand (Grandma's quirk). */
  ledLow: boolean;
  /** True when the card takes a round the partner already had covered. */
  stole: boolean;
}

const lowest = (cards: Card[]): Card => [...cards].sort((a, b) => a.rank - b.rank)[0];
const highest = (cards: Card[]): Card => [...cards].sort((a, b) => b.rank - a.rank)[0];

/** Cards in `legal` that would win the round as it stands. */
const winningCards = (legal: Card[], plays: Play[], ledSuit: 'S' | 'H' | 'D' | 'C'): Card[] => {
  if (plays.length === 0) return legal;
  const current = plays[roundWinnerIndex(plays)];
  return legal.filter((c) => cardBeats(c, current.card, ledSuit));
};

const roundWinnerIndex = (plays: Play[]): number => {
  const ledSuit = plays[0].card.suit;
  let best = 0;
  for (let i = 1; i < plays.length; i++) {
    if (cardBeats(plays[i].card, plays[best].card, ledSuit)) best = i;
  }
  return best;
};

/** Cards in `legal` that would NOT win the round as it stands. */
const losingCards = (legal: Card[], plays: Play[], ledSuit: 'S' | 'H' | 'D' | 'C'): Card[] => {
  if (plays.length === 0) return legal;
  return legal.filter((c) => !winningCards([c], plays, ledSuit).includes(c));
};

/**
 * Promise for an AI seat. Estimate first, then the partner's deterministic
 * adjustment. Balanced opponents (id 'balanced') promise the estimate.
 * Returns 0 for a go-zero promise.
 */
export const choosePromise = (hand: Card[], partnerId: PartnerId): number => {
  const est = estimateWinners(hand);
  const clamp = (n: number) => Math.max(0, Math.min(13, n));
  switch (partnerId) {
    case 'grandma':
      return clamp(est - 1); // promises low
    case 'dre':
      return clamp(est + 1); // always promises 1 more than he has
    case 'marcus':
      return clamp(est); // promises accurately
    case 'theo':
      return clamp(est + 1); // promises high
    case 'june':
      return est <= 2 ? 0 : clamp(est); // if she can go zero, she will
    case 'mom':
      return clamp(est);
    case 'dad':
      return clamp(est - 1); // promises low
    case 'mae':
      return est <= 2 ? 0 : clamp(est + 1); // promises high, loves going zero
    default:
      return clamp(est); // balanced opponents
  }
};

/** Lead card for an AI seat, by quirk. */
const chooseLead = (hand: Card[], partnerId: PartnerId, spadesBroken: boolean): Card => {
  const legal = legalCards(hand, null, spadesBroken);
  const nonSpades = legal.filter((c) => c.suit !== 'S');
  switch (partnerId) {
    case 'grandma':
      return lowest(legal); // leads her lowest card every time
    case 'theo': {
      // Leads spades at the first legal chance.
      const spades = legal.filter((c) => c.suit === 'S');
      if (spades.length > 0) return highest(spades);
      return highest(legal);
    }
    case 'dre':
      return highest(legal); // leads strong
    case 'mom':
      return highest(nonSpades.length > 0 ? nonSpades : legal); // leads strong
    case 'mae':
      return highest(legal); // plays wild
    case 'marcus':
      return lowest(nonSpades.length > 0 ? nonSpades : legal); // safe, steady
    case 'dad':
      return lowest(legal); // ducks, wins by a little
    case 'june':
      return lowest(legal);
    default:
      return lowest(nonSpades.length > 0 ? nonSpades : legal);
  }
};

/**
 * Follow / respond to a led suit, by quirk.
 * `partnerWinning` = the partner already has this round covered.
 */
const chooseFollow = (
  hand: Card[],
  partnerId: PartnerId,
  ctx: AiContext,
  legal: Card[],
): Card => {
  const ledSuit = ctx.ledSuit as 'S' | 'H' | 'D' | 'C';
  const partnerWinning = ctx.currentWinnerSeat === ctx.partnerSeat;
  const wins = winningCards(legal, ctx.plays, ledSuit);
  const loses = losingCards(legal, ctx.plays, ledSuit);
  const lowestLose = loses.length > 0 ? lowest(loses) : lowest(legal);
  const lowestWin = wins.length > 0 ? lowest(wins) : null;

  // Going zero: always try to lose. Lead low already handled; here play the
  // highest card that still loses, else the lowest card overall.
  if (ctx.goingZero) {
    if (loses.length > 0) return highest(loses);
    return lowest(legal);
  }

  // Dad ducks once the team promise is already made — extras cost him.
  if (partnerId === 'dad' && ctx.teamMadePromise) return lowestLose;

  // Marcus never plays a spade until he has to: when void in the led suit he
  // discards his lowest non-spade instead of winning with a spade.
  if (partnerId === 'marcus') {
    const hasLedSuit = hand.some((c) => c.suit === ledSuit);
    if (!hasLedSuit) {
      const nonSpades = legal.filter((c) => c.suit !== 'S');
      if (nonSpades.length > 0) return lowest(nonSpades);
    }
    if (partnerWinning) return lowestLose;
    return lowestWin ?? lowest(legal);
  }

  // Theo always wins with a spade when he is void, even if the partner had
  // the round covered — that is how he steals your win.
  if (partnerId === 'theo') {
    const hasLedSuit = hand.some((c) => c.suit === ledSuit);
    if (!hasLedSuit) {
      const spades = legal.filter((c) => c.suit === 'S');
      if (spades.length > 0 && lowestWin) return lowestWin;
      const nonSpades = legal.filter((c) => c.suit !== 'S');
      if (nonSpades.length > 0) return lowest(nonSpades);
    }
    if (partnerWinning) return lowestLose;
    return lowestWin ?? lowest(legal);
  }

  // Grandma and Mom never steal your win: if the partner has the round
  // covered, play the lowest card that does not win it.
  if (partnerId === 'grandma' || partnerId === 'mom') {
    if (partnerWinning) return lowestLose;
    return lowestWin ?? lowest(legal);
  }

  // Dre and Mae sometimes steal: if the partner has the round covered and
  // they hold a card that beats the partner's, they play the lowest such card.
  if (partnerId === 'dre' || partnerId === 'mae') {
    if (partnerWinning && lowestWin) return lowestWin;
    if (partnerWinning) return lowestLose;
    return lowestWin ?? lowest(legal);
  }

  // Dad (not yet made promise) and June and balanced opponents:
  // don't steal when the partner has it covered; otherwise win cheaply.
  if (partnerWinning) return lowestLose;
  return lowestWin ?? lowest(legal);
};

export const chooseCard = (partnerId: PartnerId, ctx: AiContext): AiChoice => {
  const legal = legalCards(ctx.hand, ctx.ledSuit, ctx.spadesBroken);
  let card: Card;
  if (ctx.ledSuit === null || ctx.plays.length === 0) {
    card = chooseLead(ctx.hand, partnerId, ctx.spadesBroken);
  } else {
    card = chooseFollow(ctx.hand, partnerId, ctx, legal);
  }
  // If going zero and leading, lead the lowest card (lose the round).
  if (ctx.goingZero && (ctx.ledSuit === null || ctx.plays.length === 0)) {
    card = lowest(legal);
  }
  const ledLow = ctx.hand.every((c) => c.rank >= card.rank);
  const stole =
    ctx.currentWinnerSeat === ctx.partnerSeat &&
    ctx.plays.length > 0 &&
    roundWinner([...ctx.plays, { seat: ctx.mySeat, card }]) === ctx.mySeat;
  return { card, ledLow, stole };
};

/** Human hint for the promise picker: a plain count of likely winners. */
export const likelyWinnersHint = (hand: Card[]): number => estimateWinners(hand);

export const partnerStatsFor = (id: PartnerId) => partnerById(id).stats;
