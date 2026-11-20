// Balance report — `npm run balance` (not part of `npm test`: ~1 minute).
// Simulates seeded games for every partner and checks you get what you pay
// for: each price tier's average win rate is at least the tier below's.
// The human seat is played by balanced dots at Normal skill (someone who
// follows the promise hint); opponents are the two balanced neighbours.
import { PARTNERS } from '../../constants/partners';
import { type Difficulty } from '../../constants/difficulty';
import { winRate } from './balance';

jest.setTimeout(30 * 60 * 1000);
const GAMES = Number(process.env.BALANCE_GAMES ?? 1500);

const report = (difficulty: Difficulty) => {
  const rows = PARTNERS.map((p) => ({ p, win: winRate(GAMES, p.stats, p.skill, { difficulty, seed0: 500000 }) }));
  console.log(
    `${difficulty} opponents, ${GAMES} games each, first to 250\n` +
      rows.map(({ p, win }) => `  ${p.name.padEnd(18)} ${String(p.price).padStart(3)} Coins  ${p.skill.padEnd(6)}  ${(100 * win).toFixed(1)}%`).join('\n'),
  );
  const tiers = [...new Set(PARTNERS.map((p) => p.price))].sort((a, b) => a - b);
  const avg = tiers.map((t) => {
    const r = rows.filter((x) => x.p.price === t);
    return r.reduce((s, x) => s + x.win, 0) / r.length;
  });
  return { tiers, avg };
};

it('pricier partner tiers win at least as often (Normal opponents)', () => {
  const { tiers, avg } = report('normal');
  // 1.5 points of slack for simulation noise.
  for (let i = 1; i < tiers.length; i++) expect(avg[i]).toBeGreaterThanOrEqual(avg[i - 1] - 0.015);
  expect(avg[avg.length - 1]).toBeGreaterThan(avg[0] + 0.1); // the top tier is clearly better than the starters
});
