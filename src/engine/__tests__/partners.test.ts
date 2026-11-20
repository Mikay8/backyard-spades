// Partners + rank + Coins — brief §§9–10 (exact).
import {
  PARTNERS,
  RANK_ADVANTAGES,
  STARTER_COINS,
  rankForXp,
  xpForRank,
  xpToNextRank,
} from '../../constants/partners';

describe('partners', () => {
  it('every stat is 1 to 5 dots', () => {
    for (const p of PARTNERS) {
      for (const v of Object.values(p.stats)) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(5);
      }
    }
  });
  it('there are 9 family partners, Grandpa Bill included', () => {
    expect(PARTNERS).toHaveLength(9);
    expect(PARTNERS.map((p) => p.id)).toContain('bill');
  });
  it('starters are free, the rest are locked by rank + Coins', () => {
    expect(PARTNERS.filter((p) => p.unlockRank === 0).map((p) => p.id).sort()).toEqual(['dre', 'grandma']);
    expect(PARTNERS.find((p) => p.id === 'marcus')).toMatchObject({ unlockRank: 3, price: 25 });
    expect(PARTNERS.find((p) => p.id === 'theo')).toMatchObject({ unlockRank: 5, price: 60 });
    expect(PARTNERS.find((p) => p.id === 'june')).toMatchObject({ unlockRank: 8, price: 60 });
    expect(PARTNERS.find((p) => p.id === 'mom')).toMatchObject({ unlockRank: 10, price: 120 });
    expect(PARTNERS.find((p) => p.id === 'dad')).toMatchObject({ unlockRank: 12, price: 120 });
    expect(PARTNERS.find((p) => p.id === 'mae')).toMatchObject({ unlockRank: 15, price: 120 });
    expect(PARTNERS.find((p) => p.id === 'bill')).toMatchObject({ unlockRank: 15, price: 200 });
  });
  it('you get what you pay for: skill never drops as the price rises, and the priciest plays best', () => {
    const order = ['easy', 'normal', 'hard', 'expert'];
    const byPrice = [...PARTNERS].sort((a, b) => a.price - b.price);
    const free = PARTNERS.filter((p) => p.price === 0);
    const top = byPrice[byPrice.length - 1];
    expect(free.every((p) => p.skill === 'normal')).toBe(true);
    expect(PARTNERS.filter((p) => p.price >= 120).every((p) => order.indexOf(p.skill) >= order.indexOf('hard'))).toBe(true);
    expect(top.id).toBe('bill');
    expect(top.skill).toBe('expert');
  });
});

describe('rank math — brief §10', () => {
  it('Rank = 1 + floor(XP / 100)', () => {
    expect(rankForXp(0)).toBe(1);
    expect(rankForXp(99)).toBe(1);
    expect(rankForXp(100)).toBe(2);
    expect(rankForXp(199)).toBe(2);
    expect(rankForXp(200)).toBe(3);
    expect(rankForXp(1400)).toBe(15);
  });
  it('XP to next rank', () => {
    expect(xpToNextRank(0)).toBe(100);
    expect(xpToNextRank(40)).toBe(60);
    expect(xpToNextRank(100)).toBe(100);
  });
  it('xpForRank is the inverse of rankForXp (dev rank chooser)', () => {
    expect(xpForRank(1)).toBe(0);
    expect(xpForRank(5)).toBe(400);
    expect(xpForRank(15)).toBe(1400);
    expect(rankForXp(xpForRank(10))).toBe(10);
    expect(xpForRank(0)).toBe(0);
    expect(xpForRank(99)).toBe(1400);
  });
  it('starter Coins are exactly enough for the first locked partner', () => {
    expect(STARTER_COINS).toBe(25);
  });
  it('rank advantages cover ranks 3/5/8/10/12/15', () => {
    expect(RANK_ADVANTAGES.map((a) => a.rank)).toEqual([3, 5, 8, 10, 12, 15]);
  });
  it('brief §10 worked example: win then loss', () => {
    // Win: +100 XP (Rank 2), +20 Coins (45). Loss: +25 XP (125, still Rank 2), +5 Coins (50).
    let xp = 0;
    let coins = STARTER_COINS;
    xp += 100; coins += 20;
    expect(rankForXp(xp)).toBe(2);
    expect(coins).toBe(45);
    xp += 25; coins += 5;
    expect(rankForXp(xp)).toBe(2);
    expect(coins).toBe(50);
  });
});
