// Cards — brief §7. One standard 52-card deck, Ace high, no jokers.
export type Suit = 'S' | 'H' | 'D' | 'C';

export interface Card {
  suit: Suit;
  /** 2..14 where 11=J, 12=Q, 13=K, 14=A. */
  rank: number;
}

export const SUITS: Suit[] = ['C', 'D', 'H', 'S'];
export const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
export const SUIT_NAME: Record<Suit, string> = {
  S: 'spades',
  H: 'hearts',
  D: 'diamonds',
  C: 'clubs',
};
export const isRed = (c: Card): boolean => c.suit === 'H' || c.suit === 'D';

export const rankLabel = (rank: number): string =>
  rank === 14 ? 'A' : rank === 13 ? 'K' : rank === 12 ? 'Q' : rank === 11 ? 'J' : String(rank);

export const cardId = (c: Card): string => `${c.suit}${c.rank}`;
export const cardLabel = (c: Card): string => `${rankLabel(c.rank)}${SUIT_SYMBOL[c.suit]}`;
export const sameCard = (a: Card, b: Card): boolean => a.suit === b.suit && a.rank === b.rank;

/** Parse a short code like 'AS', '10H', 'QC'. */
export const parseCard = (code: string): Card => {
  const suit = code.slice(-1) as Suit;
  const r = code.slice(0, -1);
  const rank = r === 'A' ? 14 : r === 'K' ? 13 : r === 'Q' ? 12 : r === 'J' ? 11 : parseInt(r, 10);
  return { suit, rank };
};

export const newDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 2; rank <= 14; rank++) deck.push({ suit, rank });
  }
  return deck;
};

export const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Sort by suit (clubs, diamonds, hearts, spades last) then rank high to low. */
export const sortHand = (hand: Card[]): Card[] => {
  const suitOrder: Record<Suit, number> = { C: 0, D: 1, H: 2, S: 3 };
  return [...hand].sort((a, b) => suitOrder[a.suit] - suitOrder[b.suit] || b.rank - a.rank);
};

/** Does card `a` beat card `b` in a round led with `ledSuit`? Spades beat everything. */
export const cardBeats = (a: Card, b: Card, ledSuit: Suit): boolean => {
  if (a.suit === 'S' && b.suit !== 'S') return true;
  if (b.suit === 'S' && a.suit !== 'S') return false;
  if (a.suit === b.suit) return a.rank > b.rank;
  if (a.suit === ledSuit) return true;
  return false;
};

export interface Play {
  seat: number;
  card: Card;
}

export const roundWinner = (plays: Play[]): number => {
  const ledSuit = plays[0].card.suit;
  let best = plays[0];
  for (const p of plays.slice(1)) {
    if (cardBeats(p.card, best.card, ledSuit)) best = p;
  }
  return best.seat;
};

/**
 * Legal cards for a seat. Leading (ledSuit null): spades may not be led until
 * one has been played, unless the leader has only spades left. Following: must
 * follow the led suit if you have it.
 */
export const legalCards = (hand: Card[], ledSuit: Suit | null, spadesBroken: boolean): Card[] => {
  if (ledSuit === null) {
    const nonSpades = hand.filter((c) => c.suit !== 'S');
    if (!spadesBroken && nonSpades.length > 0) return nonSpades;
    return [...hand];
  }
  const follow = hand.filter((c) => c.suit === ledSuit);
  return follow.length > 0 ? follow : [...hand];
};

/**
 * Deterministic estimate of likely winners in a hand: aces, high spades, and
 * a point for a long spade suit. Used by AI promises and the promise-picker
 * hint ("likely winners"). Not a probability — a plain count.
 */
export const estimateWinners = (hand: Card[]): number => {
  let n = 0;
  for (const c of hand) {
    if (c.rank === 14) n += 1;
    else if (c.suit === 'S' && c.rank >= 12) n += 1;
  }
  if (hand.filter((c) => c.suit === 'S').length >= 5) n += 1;
  return Math.min(13, n);
};
