// Card AI: stat dots drive the partner's choices; skill drives the opponents'.
import { parseCard, type Card } from '../cards';
import { chooseCard, choosePromise, makeRand, opponentPlayer, BALANCED, type AiContext, type AiPlayer, type Rand } from '../ai';
import { PARTNERS, partnerById, type Stats } from '../../constants/partners';
import { effectiveStats, itemById } from '../../constants/items';
import { DIFFICULTIES, effectiveDifficulty, minDifficultyForRank } from '../../constants/difficulty';

const hand = (...codes: string[]): Card[] => codes.map(parseCard);
const always: Rand = () => 0; // every chance with p > 0 happens
const never: Rand = () => 0.999999; // every chance with p < 1 is skipped
const traits = (over: Partial<Stats>): AiPlayer => ({ traits: { ...BALANCED, ...over }, skill: 'normal' });

const baseCtx = (over: Partial<AiContext>): AiContext => ({
  hand: [],
  ledSuit: null,
  plays: [],
  spadesBroken: false,
  mySeat: 2,
  partnerSeat: 0,
  currentWinnerSeat: null,
  goingZero: false,
  teamMadePromise: false,
  roundsLeft: 13,
  ...over,
});

/** How often `pick` happens over many seeded games. */
const rate = (n: number, pick: (r: Rand) => boolean) => {
  let hits = 0;
  for (let i = 0; i < n; i++) if (pick(makeRand(1000 + i))) hits++;
  return hits / n;
};

// Partner (seat 0) is winning the hearts round with the Queen; I hold A and 2.
const coveredCtx = baseCtx({ hand: hand('AH', '2H'), ledSuit: 'H', plays: [{ seat: 0, card: parseCard('QH') }], currentWinnerSeat: 0 });
const stealsFrom = (p: AiPlayer, r: Rand) => chooseCard(p, coveredCtx, r).stole;

describe('promise — Bids Big and Loves Going Zero dots', () => {
  // A♠ + A♥ + K♠ = 3 likely winners.
  const three = hand('AS', 'AH', 'KS', '2C', '3D', '4H', '5C', '6D', '7H', '8C', '9D', '10H', 'JC');
  const weak = hand('2C', '3D', '4H', '5C', '6D', '7H', '8C', '9D', '10H', 'JC', 'QD', '2H', '3C');

  it('Bids Big 5 promises one over, 1 one under, 3 exactly', () => {
    expect(choosePromise(three, traits({ bidsBig: 5 }))).toBe(4);
    expect(choosePromise(three, traits({ bidsBig: 1 }))).toBe(2);
    expect(choosePromise(three, traits({ bidsBig: 3 }))).toBe(3);
  });
  it('Bids Big 4 goes one over about half the time', () => {
    const r = rate(2000, (rand) => choosePromise(three, traits({ bidsBig: 4 }), rand) === 4);
    expect(r).toBeGreaterThan(0.4);
    expect(r).toBeLessThan(0.6);
  });
  it('Loves Going Zero 5 goes zero on a weak hand; 1 never does', () => {
    expect(choosePromise(weak, traits({ lovesZero: 5 }), never)).toBe(0);
    expect(choosePromise(weak, traits({ lovesZero: 1 }), always)).toBeGreaterThan(0);
  });
  it('nobody goes zero holding a high spade', () => {
    const risky = hand('KS', '3D', '4H', '5C', '6D', '7H', '8C', '9D', '10H', 'JC', 'QD', '2H', '3C');
    expect(choosePromise(risky, traits({ lovesZero: 5 }), always)).toBeGreaterThan(0);
  });
  it('June (Loves Going Zero 5) goes zero on a weak hand, Grandma (1) does not', () => {
    expect(choosePromise(weak, partnerById('june').id)).toBe(0);
    expect(choosePromise(weak, partnerById('grandma').id)).toBeGreaterThan(0);
  });
});

describe('play — each dot is a chance', () => {
  it("Won't Steal Your Win 5 never takes a round you're winning; 1 always does", () => {
    expect(stealsFrom(traits({ wontSteal: 5 }), always)).toBe(false);
    expect(stealsFrom(traits({ wontSteal: 1 }), never)).toBe(true);
  });
  it("Won't Steal 2 takes your round about 75% of the time", () => {
    const r = rate(3000, (rand) => stealsFrom(traits({ wontSteal: 2 }), rand));
    expect(r).toBeGreaterThan(0.7);
    expect(r).toBeLessThan(0.8);
  });
  it('an item really changes play: Fake Mustache (+1 Won’t Steal) makes Dre steal less', () => {
    const dre = partnerById('dre');
    const plain: AiPlayer = { traits: dre.stats, skill: 'normal' };
    const withStache: AiPlayer = { traits: effectiveStats(dre, itemById('stache')), skill: 'normal' };
    const a = rate(3000, (rand) => stealsFrom(plain, rand));
    const b = rate(3000, (rand) => stealsFrom(withStache, rand));
    expect(a).toBeGreaterThan(b + 0.15); // 75% → 50%
  });
  it('Avoids Extras 5 ducks once the team promise is made', () => {
    const ctx = baseCtx({ hand: hand('AH', '2H'), ledSuit: 'H', plays: [{ seat: 1, card: parseCard('KH') }], currentWinnerSeat: 1, teamMadePromise: true });
    expect(chooseCard(traits({ avoidsExtras: 5 }), ctx, always).card).toEqual(parseCard('2H'));
    expect(chooseCard(traits({ avoidsExtras: 1 }), ctx, always).card).toEqual(parseCard('AH'));
  });
  it('Saves Spades 1 leads spades as soon as they are open; 5 never does', () => {
    const ctx = baseCtx({ hand: hand('AS', 'KH', '2C'), spadesBroken: true });
    expect(chooseCard(traits({ savesSpades: 1 }), ctx, never).card.suit).toBe('S');
    expect(chooseCard(traits({ savesSpades: 5 }), ctx, always).card.suit).not.toBe('S');
  });
  it('no one leads a spade before spades are open', () => {
    const ctx = baseCtx({ hand: hand('AS', 'KH', '2C'), spadesBroken: false });
    expect(chooseCard(traits({ savesSpades: 1 }), ctx, always).card.suit).not.toBe('S');
  });
  it('Saves Spades 5 usually discards instead of trumping', () => {
    const ctx = baseCtx({ hand: hand('2S', '5C', '9D'), ledSuit: 'H', plays: [{ seat: 1, card: parseCard('KH') }], currentWinnerSeat: 1 });
    expect(chooseCard(traits({ savesSpades: 5 }), ctx).card).toEqual(parseCard('5C'));
    expect(chooseCard(traits({ savesSpades: 1 }), ctx).card).toEqual(parseCard('2S'));
  });
  it('Leads Strong 5 leads high, 1 leads low', () => {
    const ctx = baseCtx({ hand: hand('KH', '9D', '3C') });
    expect(chooseCard(traits({ leadsStrong: 5, savesSpades: 5 }), ctx, always).card).toEqual(parseCard('KH'));
    expect(chooseCard(traits({ leadsStrong: 1, savesSpades: 5 }), ctx, always).card).toEqual(parseCard('3C'));
  });
  it('going zero always tries to lose', () => {
    const ctx = baseCtx({ hand: hand('AH', '2H'), ledSuit: 'H', plays: [{ seat: 1, card: parseCard('KH') }], currentWinnerSeat: 1, goingZero: true });
    expect(chooseCard(traits({ wontSteal: 1 }), ctx, always).card).toEqual(parseCard('2H'));
  });
  it('without a rand function, choices are deterministic', () => {
    const ctx = baseCtx({ hand: hand('AS', 'KH', '2C'), spadesBroken: true });
    expect(chooseCard('theo', ctx).card).toEqual(chooseCard('theo', ctx).card);
  });
  it('every partner plays a legal card in every situation', () => {
    for (const p of PARTNERS) {
      const ctx = baseCtx({ hand: hand('AH', '2H', '5C'), ledSuit: 'H', plays: [{ seat: 1, card: parseCard('KH') }], currentWinnerSeat: 1 });
      expect(chooseCard(p.id, ctx).card.suit).toBe('H');
    }
  });
});

describe('opponent skill', () => {
  it('Expert leaves a round with an opponent who is going zero', () => {
    // Seat 1 (zero target) is winning with the 9; I could win with the Ace.
    const ctx = baseCtx({ mySeat: 3, partnerSeat: 1, hand: hand('AH', '4H'), ledSuit: 'H', plays: [{ seat: 0, card: parseCard('3H') }, { seat: 2, card: parseCard('9H') }], currentWinnerSeat: 2, zeroTargets: [2] });
    expect(chooseCard(opponentPlayer('expert'), ctx).card).toEqual(parseCard('4H'));
    expect(chooseCard(opponentPlayer('normal'), ctx).card).toEqual(parseCard('AH'));
  });
  it('Hard plays second-hand low when its winner is not a sure thing', () => {
    // 5♥ led; I hold Q♥ (not the boss — A/K unseen) and 2♥.
    const ctx = baseCtx({ mySeat: 1, partnerSeat: 3, hand: hand('QH', '2H'), ledSuit: 'H', plays: [{ seat: 0, card: parseCard('5H') }], currentWinnerSeat: 0, played: [parseCard('5H')] });
    expect(chooseCard(opponentPlayer('hard'), ctx).card).toEqual(parseCard('2H'));
    expect(chooseCard(opponentPlayer('normal'), ctx).card).toEqual(parseCard('QH'));
  });
  it('Hard cashes a sure winner (a boss card) when leading', () => {
    // A♥ and K♥ already played, so my Q♥ is the highest heart left.
    const ctx = baseCtx({ mySeat: 1, partnerSeat: 3, hand: hand('QH', '9C', '3D'), played: [parseCard('AH'), parseCard('KH')] });
    expect(chooseCard(opponentPlayer('hard'), ctx).card).toEqual(parseCard('QH'));
  });
  it('Easy throws away its biggest losing card', () => {
    const ctx = baseCtx({ mySeat: 1, partnerSeat: 3, hand: hand('JH', '3H'), ledSuit: 'H', plays: [{ seat: 0, card: parseCard('AH') }], currentWinnerSeat: 0 });
    expect(chooseCard(opponentPlayer('easy'), ctx, never).card).toEqual(parseCard('JH'));
    expect(chooseCard(opponentPlayer('normal'), ctx, never).card).toEqual(parseCard('3H'));
  });
});

describe('difficulty levels', () => {
  it('rank sets the minimum: Easy 1–4, Normal 5–9, Hard 10–14, Expert 15+', () => {
    expect([1, 4, 5, 9, 10, 14, 15, 30].map(minDifficultyForRank)).toEqual(['easy', 'easy', 'normal', 'normal', 'hard', 'hard', 'expert', 'expert']);
  });
  it('you can choose harder, never easier', () => {
    expect(effectiveDifficulty('expert', 1)).toBe('expert');
    expect(effectiveDifficulty('easy', 10)).toBe('hard');
    expect(effectiveDifficulty('normal', 12)).toBe('hard');
  });
  it('harder wins pay more Coins', () => {
    const coins = DIFFICULTIES.map((d) => d.winCoins);
    expect(coins).toEqual([20, 30, 45, 60]);
  });
});
