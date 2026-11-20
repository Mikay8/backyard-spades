// Balance simulation: how often does each partner win with a decent player?
// The human seat is played by balanced dots at Normal skill (a stand-in for a
// person following the promise hint); opponents are the two balanced neighbours.
import { BALANCED, choosePromise, makeRand, type AiPlayer } from '../ai';
import { createGame, nextDeal, playAiTurn, playSeatWithAi, setPlayerPromise, YOU, type GameState } from '../game';
import { type Difficulty } from '../../constants/difficulty';
import { type Stats } from '../../constants/partners';

export const playOneGame = (
  seed: number,
  traits: Stats,
  skill: Difficulty,
  opts: { difficulty?: Difficulty; humanBids?: number; humanSkill?: Difficulty } = {},
): GameState => {
  const human: AiPlayer = { traits: { ...BALANCED, bidsBig: opts.humanBids ?? 3 }, skill: opts.humanSkill ?? 'normal' };
  let g = createGame({ partnerId: 'x', seed, difficulty: opts.difficulty ?? 'normal', target: 250, partnerTraits: traits, partnerSkill: skill, opponents: ['nbrL', 'nbrR'] });
  for (let guard = 0; g.phase !== 'gameOver' && guard < 20000; guard++) {
    if (g.phase === 'promise') g = setPlayerPromise(g, choosePromise(g.hands[YOU], human, makeRand(seed * 31 + g.dealNumber)));
    else if (g.phase === 'dealScore') g = nextDeal(g);
    else if (g.turnSeat === YOU) g = playSeatWithAi(g, YOU, human);
    else g = playAiTurn(g);
  }
  return g;
};

export const winRate = (
  games: number,
  traits: Stats,
  skill: Difficulty,
  opts: { difficulty?: Difficulty; humanBids?: number; humanSkill?: Difficulty; seed0?: number } = {},
): number => {
  let wins = 0;
  for (let i = 0; i < games; i++) if (playOneGame((opts.seed0 ?? 1) + i, traits, skill, opts).winner === 'us') wins++;
  return wins / games;
};
