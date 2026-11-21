// Coin Shop packs — MOCK prices for now. No payment is taken: buying a pack
// just adds its Coins. When real purchases are wired up (App Store / Google
// Play in-app purchases, or Stripe on the web), these become product ids
// and the price comes from the store, not from here.

export interface CoinPack {
  id: string;
  name: string;
  coins: number;
  /** Extra Coins on top, shown as "+N bonus". */
  bonus: number;
  /** Mock price in US dollars. */
  usd: number;
  /** Short tag such as "Best value". */
  tag?: string;
  /** How many coin sprites to draw on the card (1–4). */
  stack: number;
}

export const COIN_PACKS: CoinPack[] = [
  { id: 'handful', name: 'Handful', coins: 100, bonus: 0, usd: 0.99, stack: 1 },
  { id: 'pouch', name: 'Pouch', coins: 300, bonus: 30, usd: 2.99, stack: 2 },
  { id: 'bag', name: 'Bag', coins: 650, bonus: 100, usd: 5.99, tag: 'Popular', stack: 3 },
  { id: 'chest', name: 'Chest', coins: 1400, bonus: 300, usd: 11.99, tag: 'Best value', stack: 4 },
];

export const formatUsd = (usd: number) => '$' + usd.toFixed(2);
