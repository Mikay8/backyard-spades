import { type Difficulty } from './difficulty';
// Partners, rank, Coins — brief §§9–10 (exact). Every partner totals 18.
export type StatKey =
  | 'bidsBig'
  | 'savesSpades'
  | 'wontSteal'
  | 'avoidsExtras'
  | 'lovesZero'
  | 'leadsStrong';

export const STAT_LABELS: Record<StatKey, string> = {
  bidsBig: 'Bids Big',
  savesSpades: 'Saves Spades',
  wontSteal: "Won't Steal Your Win",
  avoidsExtras: 'Avoids Extras',
  lovesZero: 'Loves Going Zero',
  leadsStrong: 'Leads Strong',
};

export const STAT_ORDER: StatKey[] = [
  'bidsBig',
  'savesSpades',
  'wontSteal',
  'avoidsExtras',
  'lovesZero',
  'leadsStrong',
];

export type Stats = Record<StatKey, number>;

export interface PartnerDef {
  id: string;
  name: string;
  role: string;
  quirk: string;
  goodWith: string;
  watchOut: string;
  stats: Stats;
  /** Rank needed before this partner can be bought. 0 = free starter. */
  unlockRank: number;
  /** Coins to buy once the rank is reached. 0 = free. */
  price: number;
  /** Portrait file stem in assets/images (p- prefix) or grandma- prefix. */
  portrait: string;
  /** Quirk icon file stem (i- prefix). */
  icon: string;
  /** How well they play the cards. Pricier partners play better. */
  skill: Difficulty;
}

export const PARTNERS: PartnerDef[] = [
  {
    id: 'grandma',
    name: 'Grandma Rose',
    role: 'The Steady One',
    quirk: 'Forgot her glasses again.',
    goodWith: 'Good with you if you promise big yourself — she never steals your win.',
    watchOut: 'Watch out: she leads low every time and leaves points on the table.',
    stats: { bidsBig: 2, savesSpades: 3, wontSteal: 5, avoidsExtras: 5, lovesZero: 1, leadsStrong: 2 },
    unlockRank: 0,
    price: 0,
    portrait: 'grandma',
    skill: 'normal',
    icon: 'i-glasses',
  },
  {
    id: 'dre',
    name: 'Uncle Dre',
    role: 'Overconfident',
    quirk: 'Bids big and plays bold. Sometimes too bold.',
    goodWith: 'Good with you if your hand is strong — he leads strong and plays bold.',
    watchOut: 'Watch out: he promises 4 when he has 3, and sometimes takes a round you had covered.',
    stats: { bidsBig: 4, savesSpades: 3, wontSteal: 2, avoidsExtras: 2, lovesZero: 2, leadsStrong: 4 },
    unlockRank: 0,
    price: 0,
    portrait: 'p-dre',
    skill: 'normal',
    icon: 'i-stache',
  },
  {
    id: 'marcus',
    name: 'Cousin Marcus',
    role: 'The Calculator',
    quirk: 'Counts every card out loud.',
    goodWith: 'Good with you if you want a safe, steady game — he never wastes a spade.',
    watchOut: 'Watch out: slow, safe, never flashy — no big swings.',
    stats: { bidsBig: 3, savesSpades: 5, wontSteal: 3, avoidsExtras: 4, lovesZero: 1, leadsStrong: 2 },
    unlockRank: 3,
    price: 25,
    portrait: 'p-marcus',
    skill: 'hard',
    icon: 'i-notebook',
  },
  {
    id: 'theo',
    name: 'Big Brother Theo',
    role: 'Plays Spades Early',
    quirk: 'Slams his spades down fast.',
    goodWith: 'Good with you if you want spades out early and the table opened up.',
    watchOut: 'Watch out: he burns spades you might have needed later.',
    stats: { bidsBig: 3, savesSpades: 1, wontSteal: 2, avoidsExtras: 3, lovesZero: 3, leadsStrong: 5 },
    unlockRank: 5,
    price: 60,
    portrait: 'p-theo',
    skill: 'normal',
    icon: 'i-tongs',
  },
  {
    id: 'june',
    name: 'Auntie June',
    role: 'Loves Going Zero',
    quirk: "'I got nothing' — and she means it.",
    goodWith: 'Good with you if you like huge swing games — she will go zero when she can.',
    watchOut: 'Watch out: terrible if you just want a safe win.',
    stats: { bidsBig: 3, savesSpades: 5, wontSteal: 2, avoidsExtras: 2, lovesZero: 5, leadsStrong: 2 },
    unlockRank: 8,
    price: 60,
    portrait: 'p-june',
    skill: 'normal',
    icon: 'i-sunhat',
  },
  {
    id: 'mom',
    name: 'Mom',
    role: 'The Bold Cover',
    quirk: 'Never steals your win — and leads strong.',
    goodWith: 'Good with you if you promise big and want cover plus pressure.',
    watchOut: 'Watch out: her strong leads can cost you extras.',
    stats: { bidsBig: 3, savesSpades: 2, wontSteal: 5, avoidsExtras: 3, lovesZero: 3, leadsStrong: 4 },
    unlockRank: 10,
    price: 120,
    portrait: 'p-mom',
    skill: 'hard',
    icon: 'i-lemonade',
  },
  {
    id: 'dad',
    name: 'Dad',
    role: 'Hates Extras',
    quirk: 'Wins by a little, never by too much.',
    goodWith: 'Good with you when the game is tight and extras would cost you.',
    watchOut: 'Watch out: big wins are rare with him.',
    stats: { bidsBig: 3, savesSpades: 3, wontSteal: 4, avoidsExtras: 5, lovesZero: 4, leadsStrong: 2 },
    unlockRank: 12,
    price: 120,
    portrait: 'p-dad',
    skill: 'hard',
    icon: 'i-clover',
  },
  {
    id: 'mae',
    name: 'Little Sister Mae',
    role: 'The Big Swing',
    quirk: 'Huge wins or big misses, never in the middle.',
    goodWith: 'Good with you if you like high-risk games.',
    watchOut: 'Watch out: the most volatile partner — a bad hand with Mae is a big loss.',
    stats: { bidsBig: 4, savesSpades: 3, wontSteal: 3, avoidsExtras: 2, lovesZero: 5, leadsStrong: 2 },
    unlockRank: 15,
    price: 120,
    portrait: 'p-mae',
    skill: 'hard',
    icon: 'i-chicken',
  },
  {
    id: 'bill',
    name: 'Grandpa Bill',
    role: 'The Old Pro',
    quirk: '“Was that hearts?” He mumbles — then plays the perfect card.',
    goodWith: 'Good with you if you want the best partner at the table — he reads the whole game.',
    watchOut: 'Watch out: he costs the most, and loves going zero.',
    stats: { bidsBig: 3, savesSpades: 1, wontSteal: 4, avoidsExtras: 4, lovesZero: 5, leadsStrong: 5 },
    unlockRank: 15,
    price: 200,
    portrait: 'bill',
    skill: 'expert',
    icon: 'i-clover',
  },
];
export const partnerById = (id: string): PartnerDef =>
  PARTNERS.find((p) => p.id === id) ?? PARTNERS[0];

export const statTotal = (p: PartnerDef): number =>
  STAT_ORDER.reduce((sum, k) => sum + p.stats[k], 0);


/** Rank + Coins — brief §10 (exact). */
export const STARTER_COINS = 25;
export const WIN_XP = 100;
export const LOSS_XP = 25;
export const GO_ZERO_WIN_XP_BONUS = 50;
export const WIN_COINS = 20;
export const LOSS_COINS = 5;
export const GO_ZERO_WIN_COINS_BONUS = 10;

export const rankForXp = (xp: number): number => 1 + Math.floor(Math.max(0, xp) / 100);
export const xpIntoRank = (xp: number): number => Math.max(0, xp) % 100;
export const xpToNextRank = (xp: number): number => 100 - xpIntoRank(xp);

/** XP at the start of a rank (rank 1 → 0, rank 15 → 1400). Used by the
 *  dev-only rank chooser; ranks clamp to 1–15. */
export const xpForRank = (rank: number): number =>
  Math.max(0, Math.min(15, Math.max(1, Math.floor(rank))) - 1) * 100;

export interface RankAdvantage {
  rank: number;
  label: string;
}

export const RANK_ADVANTAGES: RankAdvantage[] = [
  { rank: 3, label: 'Cousin Marcus is ready to buy (25 Coins)' },
  { rank: 5, label: 'Big Brother Theo is ready to buy (60 Coins) + See the promise' },
  { rank: 8, label: 'Auntie June is ready to buy (60 Coins)' },
  { rank: 10, label: 'Mom is ready to buy (120 Coins) + Favourite partner + partner review' },
  { rank: 12, label: 'Dad is ready to buy (120 Coins)' },
  { rank: 15, label: 'Little Sister Mae (120 Coins) and Grandpa Bill (200 Coins) are ready to buy + Table themes' },
];

export const nextUnlockAfter = (rank: number): PartnerDef | null =>
  PARTNERS.filter((p) => p.unlockRank > rank).sort((a, b) => a.unlockRank - b.unlockRank)[0] ?? null;

/** Card header colour per partner — design canvas. */
export const PARTNER_ACCENT: Record<string, string> = {
  grandma: '#9a7fc8',
  dre: '#4a8a3a',
  marcus: '#2f6f8a',
  theo: '#e8903a',
  june: '#d9631e',
  mom: '#2c9c8f',
  dad: '#3b6fd0',
  mae: '#e0568a',
  bill: '#c9922e',
};

/** Plain-language line for each stat value 1..5 (partner detail screen). */
export const STAT_TEXT: Record<StatKey, string[]> = {
  bidsBig: ['promises low', 'promises low', 'promises about right', 'promises high', 'promises high'],
  savesSpades: ['plays spades early', 'plays spades early', 'uses spades when needed', 'saves spades', 'saves spades'],
  wontSteal: ['often takes your round', 'often takes your round', 'sometimes takes your round', 'rarely takes your round', 'never takes your round'],
  avoidsExtras: ['wins extras freely', 'wins extras freely', 'watches extras a little', 'avoids extras', 'avoids extras'],
  lovesZero: ['never goes zero', 'rarely goes zero', 'sometimes goes zero', 'goes zero a lot', 'loves going zero'],
  leadsStrong: ['plays safe', 'plays safe', 'mixes it up', 'leads strong', 'leads strong'],
};

/** "Good with you if…" / "Watch out…" without the lead-in words (cards add them in bold). */
export const stripLead = (s: string): string =>
  s.replace(/^Good with you (if|when) /i, '').replace(/^Watch out:\s*/i, '').replace(/^./, (c) => c.toUpperCase());
