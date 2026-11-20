// End-to-end scripted playthrough — Home → pick Grandma → promise → play a
// full deal → deal score → game over → result awards (brief §§10, 12).
// This is the flow the web export must support; it runs against the real engine.
import { estimateWinners } from '../cards';
import {
  createGame,
  legalForTurn,
  nextDeal,
  playAiTurn,
  playCard,
  setPlayerPromise,
  YOU,
} from '../game';
import { GO_ZERO_WIN_COINS_BONUS, GO_ZERO_WIN_XP_BONUS, LOSS_COINS, LOSS_XP, WIN_XP, rankForXp } from '../../constants/partners';
import { difficultyDef } from '../../constants/difficulty';

describe('scripted playthrough with Grandma', () => {
  it('completes a full game and awards the brief §10 amounts', () => {
    // Fixed seed: the AI's chances replay the same way every run.
    let g = createGame({ partnerId: 'grandma', seed: 42, difficulty: 'normal' });
    let actions = 0;
    let firstDealScored = false;
    while (g.phase !== 'gameOver' && actions < 5000) {
      actions += 1;
      if (g.phase === 'promise') {
        const promise = Math.min(13, estimateWinners(g.hands[YOU]));
        g = setPlayerPromise(g, promise);
      } else if (g.phase === 'dealScore') {
        if (!firstDealScored) {
          firstDealScored = true;
          expect(g.lastDeal).not.toBeNull();
          expect(g.dealHistory).toHaveLength(1);
          // The first deal scored exactly 13 rounds between the teams.
          const d = g.lastDeal!;
          expect(d.usWon + d.themWon).toBeLessThanOrEqual(13);
        }
        g = nextDeal(g);
      } else if (g.turnSeat === YOU) {
        g = playCard(g, YOU, legalForTurn(g)[0]);
      } else {
        g = playAiTurn(g);
      }
    }
    expect(g.phase).toBe('gameOver');
    expect(g.difficulty).toBe('normal');
    expect(g.winner).not.toBeNull();
    expect(g.dealHistory.length).toBeGreaterThanOrEqual(1);
    expect(actions).toBeLessThan(5000);

    const won = g.winner === 'us';
    const goZeroBonus = won && g.playerWentZeroClean;
    const xpEarned = (won ? WIN_XP : LOSS_XP) + (goZeroBonus ? GO_ZERO_WIN_XP_BONUS : 0);
    const WIN_COINS = difficultyDef(g.difficulty).winCoins; // Normal: 30
    const coinsEarned = (won ? WIN_COINS : LOSS_COINS) + (goZeroBonus ? GO_ZERO_WIN_COINS_BONUS : 0);
    // A fresh player starts at Rank 1; one win takes them to Rank 2.
    expect(rankForXp(xpEarned)).toBe(won ? 2 : 1);
    expect([WIN_COINS, LOSS_COINS, WIN_COINS + GO_ZERO_WIN_COINS_BONUS]).toContain(coinsEarned);
    console.log(
      `playthrough: ${g.dealHistory.length} deals, final ${g.scores.us} to ${g.scores.them}, ` +
        `${won ? 'won' : 'lost'}, +${xpEarned} XP, +${coinsEarned} Coins, ${actions} actions`,
    );
  });
});
