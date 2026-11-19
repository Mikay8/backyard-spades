// Scoring — brief §8.2 worked examples, verified exactly.
import { gameWinner, scoreDeal } from '../scoring';

describe('scoreDeal — brief §8.2 worked examples', () => {
  it('promised 7, won 7 → 70', () => {
    expect(scoreDeal({ teamPromise: 7, teamWon: 7, goZero: [], extrasBankBefore: 0 }).points).toBe(70);
  });

  it('promised 9, won 10 → 91 (one extra)', () => {
    const s = scoreDeal({ teamPromise: 9, teamWon: 10, goZero: [], extrasBankBefore: 0 });
    expect(s.points).toBe(91);
    expect(s.extrasThisDeal).toBe(1);
    expect(s.extrasBankAfter).toBe(1);
  });

  it('promised 8, won 6 → -80 (rounds won score nothing)', () => {
    expect(scoreDeal({ teamPromise: 8, teamWon: 6, goZero: [], extrasBankBefore: 0 }).points).toBe(-80);
  });

  it('go zero clean: team made 6, June won 0 → 60 + 100 = 160', () => {
    const s = scoreDeal({
      teamPromise: 6,
      teamWon: 6,
      goZero: [{ attempted: true, won: 0 }],
      extrasBankBefore: 0,
    });
    expect(s.points).toBe(160);
    expect(s.goZeroDelta).toBe(100);
  });

  it('go zero missed: team made 6, June won 1 → 60 - 100 = -40', () => {
    // June's round does not count toward W (see game.ts teamWon): W stays 6.
    const s = scoreDeal({
      teamPromise: 6,
      teamWon: 6,
      goZero: [{ attempted: true, won: 1 }],
      extrasBankBefore: 0,
    });
    expect(s.points).toBe(-40);
    expect(s.goZeroDelta).toBe(-100);
  });

  it('extras: 8 banked + 3 this deal → -100 now, 1 carries over', () => {
    const s = scoreDeal({ teamPromise: 7, teamWon: 10, goZero: [], extrasBankBefore: 8 });
    expect(s.extrasThisDeal).toBe(3);
    expect(s.extrasPenalty).toBe(100);
    expect(s.extrasBankAfter).toBe(1);
    expect(s.points).toBe(70 + 3 - 100);
  });

  it('9 extras banked, no extras this deal → no penalty yet', () => {
    const s = scoreDeal({ teamPromise: 5, teamWon: 5, goZero: [], extrasBankBefore: 9 });
    expect(s.extrasPenalty).toBe(0);
    expect(s.extrasBankAfter).toBe(9);
    expect(s.points).toBe(50);
  });
});

describe('gameWinner', () => {
  it('first to 500 wins', () => {
    expect(gameWinner({ us: 512, them: 340 })).toBe('us');
    expect(gameWinner({ us: 340, them: 512 })).toBe('them');
  });
  it('-200 loses', () => {
    expect(gameWinner({ us: -200, them: 100 })).toBe('them');
    expect(gameWinner({ us: 100, them: -200 })).toBe('us');
  });
  it('tie at 500+ means one more deal', () => {
    expect(gameWinner({ us: 500, them: 500 })).toBeNull();
    expect(gameWinner({ us: 499, them: 499 })).toBeNull();
  });
  it('higher score wins when both cross 500', () => {
    expect(gameWinner({ us: 520, them: 505 })).toBe('us');
  });
});
