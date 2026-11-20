// Game state machine — brief §§6–8. Pure functions over plain state so the
// engine can be unit-tested and driven by the UI or by a scripted playthrough.
// Seats: 0 = You, 1 = Left opponent, 2 = Partner, 3 = Right opponent.
// Play order is clockwise: 0 -> 1 -> 2 -> 3 -> 0.
import {
  legalCards,
  newDeck,
  parseCard,
  roundWinner,
  shuffle,
  sortHand,
  type Card,
  type Play,
} from './cards';
import { chooseCard, choosePromise, makeRand, opponentPlayer, type AiPlayer } from './ai';
import { partnerById, type Stats } from '../constants/partners';
import { type Difficulty } from '../constants/difficulty';
import { castById, pickOpponents } from '../constants/cast';
import { gameWinner, scoreDeal } from './scoring';

export const YOU = 0;
export const LEFT = 1;
export const PARTNER = 2;
export const RIGHT = 3;

export const TEAM_OF: Record<number, 'us' | 'them'> = {
  [YOU]: 'us',
  [PARTNER]: 'us',
  [LEFT]: 'them',
  [RIGHT]: 'them',
};

export interface DealResult {
  deal: number;
  usPromise: number;
  usWon: number;
  themPromise: number;
  themWon: number;
  usPoints: number;
  themPoints: number;
  usExtras: number;
  themExtras: number;
  goZeroDeltaUs: number;
  goZeroDeltaThem: number;
  /** Partner's own promise / rounds won this deal (for the result review line). */
  partnerPromise: number;
  partnerWon: number;
}

export interface PartnerGameStats {
  promisedTotal: number;
  wonTotal: number;
  ledLow: number;
  stole: number;
}

export type GamePhase = 'promise' | 'play' | 'dealScore' | 'gameOver';

export interface GameState {
  partnerId: string;
  dealNumber: number;
  dealerSeat: number;
  hands: Card[][];
  promises: (number | null)[];
  spadesBroken: boolean;
  currentPlays: Play[];
  leaderSeat: number;
  turnSeat: number;
  wonRounds: number[];
  scores: { us: number; them: number };
  extrasBank: { us: number; them: number };
  dealHistory: DealResult[];
  lastDeal: DealResult | null;
  phase: GamePhase;
  winner: 'us' | 'them' | null;
  lastRoundWinner: number | null;
  lastRoundPlays: Play[];
  partnerStats: PartnerGameStats;
  playerWentZeroClean: boolean;
  /** Rank 5 advantage: the player sees the partner's promise before promising. */
  seePartnerPromise: boolean;
  /** Points to win: 500 classic, 250 quick. */
  target: number;
  /** How well the opponents play. */
  difficulty: Difficulty;
  /** The partner's stat dots for this game (item boost included) — the AI plays from these. */
  partnerTraits: Stats;
  /** How well the partner plays the cards (pricier partners play better). */
  partnerSkill: Difficulty;
  /** Seeds the AI's chances so a game is reproducible. */
  seed: number;
  /** Every card played so far this deal (for card counting). */
  playedCards: Card[];
  /** Finished rounds this deal, in order (who played what — for spotting empty suits). */
  rounds: Play[][];
  /** Cast ids of the opponents: [left, right]. Drawn at random per game. */
  opponents: [string, string];
}

export interface NewGameOptions {
  partnerId: string;
  seePartnerPromise?: boolean;
  /** Points to win (default 500). */
  target?: number;
  /** Opponent skill (default 'normal'). */
  difficulty?: Difficulty;
  /** Partner dots incl. item boost (default: the partner's own dots). */
  partnerTraits?: Stats;
  /** Partner card skill (default: the partner's own). */
  partnerSkill?: Difficulty;
  seed?: number;
  /** Deal number (varies the AI's chances from deal to deal). */
  dealNumber?: number;
  /** Opponent cast ids [left, right]; drawn from the seed when omitted. */
  opponents?: [string, string];
  /** Fixed hands for the tutorial / tests: [you, left, partner, right]. */
  fixedHands?: Card[][];
  dealerSeat?: number;
}

const dealHands = (fixedHands?: Card[][]): Card[][] => {
  if (fixedHands) return fixedHands.map((h) => sortHand(h));
  const deck = shuffle(newDeck());
  return [0, 1, 2, 3].map((seat) =>
    sortHand(deck.slice(seat * 13, seat * 13 + 13)),
  );
};

export const createGame = (opts: NewGameOptions): GameState => {
  const hands = dealHands(opts.fixedHands);
  const dealerSeat = opts.dealerSeat ?? YOU;
  const leaderSeat = (dealerSeat + 1) % 4;
  // AI promises are made at deal start (partner + both opponents).
  const difficulty = opts.difficulty ?? 'normal';
  const partnerTraits = opts.partnerTraits ?? partnerById(opts.partnerId).stats;
  const partnerSkill = opts.partnerSkill ?? partnerById(opts.partnerId).skill;
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31);
  const deal = opts.dealNumber ?? 1;
  const opponents = opts.opponents ?? pickOpponents(opts.partnerId, makeRand(seed ^ 0x5eed));
  const opp = (seat: number) => opponentPlayer(difficulty, castById(opponents[seat === LEFT ? 0 : 1]).stats);
  const promises: (number | null)[] = [null, null, null, null];
  const promiseRand = (seat: number) => makeRand(seed + deal * 1009 + seat * 97 + 7);
  promises[LEFT] = choosePromise(hands[LEFT], opp(LEFT), promiseRand(LEFT));
  promises[PARTNER] = choosePromise(hands[PARTNER], { traits: partnerTraits, skill: partnerSkill }, promiseRand(PARTNER));
  promises[RIGHT] = choosePromise(hands[RIGHT], opp(RIGHT), promiseRand(RIGHT));
  return {
    partnerId: opts.partnerId,
    dealNumber: deal,
    dealerSeat,
    hands,
    promises,
    spadesBroken: false,
    currentPlays: [],
    leaderSeat,
    turnSeat: leaderSeat,
    wonRounds: [0, 0, 0, 0],
    scores: { us: 0, them: 0 },
    extrasBank: { us: 0, them: 0 },
    dealHistory: [],
    lastDeal: null,
    phase: 'promise',
    winner: null,
    lastRoundWinner: null,
    lastRoundPlays: [],
    partnerStats: { promisedTotal: promises[PARTNER] ?? 0, wonTotal: 0, ledLow: 0, stole: 0 },
    playerWentZeroClean: false,
    seePartnerPromise: opts.seePartnerPromise ?? false,
    target: opts.target ?? 500,
    difficulty,
    partnerTraits,
    partnerSkill,
    seed,
    playedCards: [],
    rounds: [],
    opponents,
  };
};

/** Team promise, excluding any go-zero player (brief §8.1). */
export const teamPromise = (state: GameState, team: 'us' | 'them'): number => {
  const seats = team === 'us' ? [YOU, PARTNER] : [LEFT, RIGHT];
  return seats.reduce((sum, s) => {
    const p = state.promises[s];
    return sum + (p && p > 0 ? p : 0);
  }, 0);
};

/**
 * Rounds the team won that count toward its promise. A go-zero player's
 * rounds do NOT count: brief §8.2 proves it — June goes zero, wins 1 round,
 * team made 6 → 60 - 100 = -40 (not -39, which is what counting her round
 * as an extra would give). Her round still costs the team the -100.
 */
export const teamWon = (state: GameState, team: 'us' | 'them'): number => {
  const seats = team === 'us' ? [YOU, PARTNER] : [LEFT, RIGHT];
  return seats.reduce((sum, s) => sum + (isGoZero(state, s) ? 0 : state.wonRounds[s]), 0);
};

export const isGoZero = (state: GameState, seat: number): boolean => state.promises[seat] === 0;

export const setPlayerPromise = (state: GameState, promise: number): GameState => {
  if (state.phase !== 'promise') return state;
  const next: GameState = { ...state, promises: [...state.promises] };
  next.promises[YOU] = promise;
  next.phase = 'play';
  next.turnSeat = next.leaderSeat;
  return next;
};

/** AI promise for a seat (used by the UI to show the partner's promise early). */
export const aiPromise = (state: GameState, seat: number): number | null => state.promises[seat];

export const legalForTurn = (state: GameState): Card[] => {
  const ledSuit = state.currentPlays.length > 0 ? state.currentPlays[0].card.suit : null;
  return legalCards(state.hands[state.turnSeat], ledSuit, state.spadesBroken);
};

/**
 * Play a card for the seat whose turn it is. Returns the next state, or the
 * same state if the play is illegal (wrong turn, card not in hand, not legal).
 */
export const playCard = (state: GameState, seat: number, card: Card): GameState => {
  if (state.phase !== 'play' || seat !== state.turnSeat) return state;
  const hand = state.hands[seat];
  if (!hand.some((c) => c.suit === card.suit && c.rank === card.rank)) return state;
  const legal = legalForTurn(state);
  if (!legal.some((c) => c.suit === card.suit && c.rank === card.rank)) return state;

  const next: GameState = {
    ...state,
    hands: state.hands.map((h, i) =>
      i === seat ? h.filter((c) => !(c.suit === card.suit && c.rank === card.rank)) : h,
    ),
    currentPlays: [...state.currentPlays, { seat, card }],
    playedCards: [...state.playedCards, card],
    spadesBroken: state.spadesBroken || card.suit === 'S',
    partnerStats: { ...state.partnerStats },
  };

  if (next.currentPlays.length < 4) {
    next.turnSeat = (seat + 1) % 4;
    return next;
  }

  // Round complete.
  const winner = roundWinner(next.currentPlays);
  next.wonRounds = [...state.wonRounds];
  next.wonRounds[winner] += 1;
  next.lastRoundWinner = winner;
  next.lastRoundPlays = next.currentPlays;
  next.rounds = [...state.rounds, next.currentPlays];
  next.currentPlays = [];
  next.leaderSeat = winner;
  next.turnSeat = winner;
  if (winner === PARTNER) {
    next.partnerStats.wonTotal += 1;
  }

  // Deal complete?
  if (next.hands.every((h) => h.length === 0)) {
    return finishDeal(next);
  }
  return next;
};

/** AI plays its turn. Returns the next state (same state if not an AI turn). */
export const playAiTurn = (state: GameState): GameState => {
  const seat = state.turnSeat;
  if (state.phase !== 'play' || seat === YOU) return state;
  const player: AiPlayer =
    seat === PARTNER
      ? { traits: state.partnerTraits, skill: state.partnerSkill }
      : opponentPlayer(state.difficulty, castById(state.opponents[seat === LEFT ? 0 : 1]).stats);
  return playSeatWithAi(state, seat, player);
};

/** Let an AI player choose and play the card for `seat` (used for AI seats,
 *  and by the balance simulation to play the human seat too). */
export const playSeatWithAi = (state: GameState, seat: number, player: AiPlayer): GameState => {
  if (state.phase !== 'play' || seat !== state.turnSeat) return state;
  const otherTeam = TEAM_OF[seat] === 'us' ? [LEFT, RIGHT] : [YOU, PARTNER];
  const partnerSeat = seat === PARTNER ? YOU : seat === YOU ? PARTNER : seat === LEFT ? RIGHT : LEFT;
  const cleanZero = (s: number) => isGoZero(state, s) && state.wonRounds[s] === 0;
  // A different but reproducible stream for every turn of the game.
  const rand = makeRand(state.seed + state.dealNumber * 1009 + state.playedCards.length * 31 + seat * 7);
  const ledSuit = state.currentPlays.length > 0 ? state.currentPlays[0].card.suit : null;
  const currentWinnerSeat =
    state.currentPlays.length > 0 ? roundWinner(state.currentPlays) : null;
  const team = TEAM_OF[seat];
  const choice = chooseCard(player, {
    hand: state.hands[seat],
    ledSuit,
    plays: state.currentPlays,
    spadesBroken: state.spadesBroken,
    mySeat: seat,
    partnerSeat,
    currentWinnerSeat,
    goingZero: isGoZero(state, seat),
    teamMadePromise: teamWon(state, team) >= teamPromise(state, team),
    roundsLeft: state.hands[seat].length,
    played: state.playedCards,
    rounds: state.rounds,
    partnerGoingZero: cleanZero(partnerSeat),
    zeroTargets: otherTeam.filter(cleanZero),
  }, rand);
  // Record partner quirk stats before the play mutates state.
  const before = state;
  const after = playCard(state, seat, choice.card);
  if (after === before) return state;
  if (seat === PARTNER) {
    after.partnerStats.ledLow += choice.ledLow && ledSuit === null ? 1 : 0;
    after.partnerStats.stole += choice.stole ? 1 : 0;
  }
  return after;
};

/** Play the AI's turn repeatedly until it is the player's turn or the deal ends. */
export const advanceAi = (state: GameState): GameState => {
  let next = state;
  let guard = 0;
  while (next.phase === 'play' && next.turnSeat !== YOU && guard < 8) {
    const after = playAiTurn(next);
    if (after === next) break;
    next = after;
    guard += 1;
  }
  return next;
};

const finishDeal = (state: GameState): GameState => {
  const usPromise = teamPromise(state, 'us');
  const themPromise = teamPromise(state, 'them');
  const usWon = teamWon(state, 'us');
  const themWon = teamWon(state, 'them');
  const usScore = scoreDeal({
    teamPromise: usPromise,
    teamWon: usWon,
    goZero: [
      { attempted: isGoZero(state, YOU), won: state.wonRounds[YOU] },
      { attempted: isGoZero(state, PARTNER), won: state.wonRounds[PARTNER] },
    ],
    extrasBankBefore: state.extrasBank.us,
  });
  const themScore = scoreDeal({
    teamPromise: themPromise,
    teamWon: themWon,
    goZero: [
      { attempted: isGoZero(state, LEFT), won: state.wonRounds[LEFT] },
      { attempted: isGoZero(state, RIGHT), won: state.wonRounds[RIGHT] },
    ],
    extrasBankBefore: state.extrasBank.them,
  });
  const deal: DealResult = {
    deal: state.dealNumber,
    usPromise,
    usWon,
    themPromise,
    themWon,
    usPoints: usScore.points,
    themPoints: themScore.points,
    usExtras: usScore.extrasThisDeal,
    themExtras: themScore.extrasThisDeal,
    goZeroDeltaUs: usScore.goZeroDelta,
    goZeroDeltaThem: themScore.goZeroDelta,
    partnerPromise: state.promises[PARTNER] ?? 0,
    partnerWon: state.wonRounds[PARTNER],
  };
  const scores = { us: state.scores.us + usScore.points, them: state.scores.them + themScore.points };
  const winner = gameWinner(scores, state.target);
  const next: GameState = {
    ...state,
    scores,
    extrasBank: { us: usScore.extrasBankAfter, them: themScore.extrasBankAfter },
    dealHistory: [...state.dealHistory, deal],
    lastDeal: deal,
    phase: winner ? 'gameOver' : 'dealScore',
    winner,
    playerWentZeroClean:
      state.playerWentZeroClean || (isGoZero(state, YOU) && state.wonRounds[YOU] === 0),
  };
  return next;
};

export const nextDeal = (state: GameState): GameState => {
  if (state.phase !== 'dealScore') return state;
  const fresh = createGame({
    partnerId: state.partnerId,
    seePartnerPromise: state.seePartnerPromise,
    target: state.target,
    dealerSeat: (state.dealerSeat + 1) % 4,
    difficulty: state.difficulty,
    partnerTraits: state.partnerTraits,
    partnerSkill: state.partnerSkill,
    seed: state.seed,
    dealNumber: state.dealNumber + 1,
    opponents: state.opponents,
  });
  return {
    ...fresh,
    dealNumber: state.dealNumber + 1,
    scores: state.scores,
    extrasBank: state.extrasBank,
    dealHistory: state.dealHistory,
    playerWentZeroClean: state.playerWentZeroClean,
  };
};

/** Fixed tutorial deal — brief §13. Hands: [you, left, partner, right]. */
export const TUTORIAL_HANDS: Card[][] = [
  ['AS', 'KS', 'QH', 'QD', 'JH', '10H', '9C', '8C', '7D', '6D', '5C', '4S', '3H'],
  ['AD', 'KC', 'QS', 'JD', '10D', '9H', '8H', '7S', '6H', '5D', '4D', '3D', '2S'],
  ['AH', 'KH', 'KD', 'QC', 'JC', '10C', '9D', '8D', '7C', '6S', '5S', '4H', '3C'],
  ['AC', 'JS', '10S', '9S', '8S', '7H', '6C', '5H', '4C', '3S', '2H', '2D', '2C'],
].map((hand) => hand.map(parseCard));
