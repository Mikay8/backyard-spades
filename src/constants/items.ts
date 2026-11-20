// Shed items — from the design canvas. Each adds +1 to one or two stats
// (capped at 5), shown as ◆ in the stat dots and drawn on the portrait.
import { PARTNERS, STAT_ORDER, type PartnerDef, type StatKey, type Stats } from './partners';

export interface ItemDef {
  id: string;
  name: string;
  price: number;
  /** Stats this item boosts. */
  boost: StatKey[];
  note: string;
  /** Lucky Clover: +1 to the partner's lowest stat instead. */
  lucky?: boolean;
  /** Cheater's Mirror: one-time use, never equipped. */
  once?: boolean;
}

export const ITEMS: ItemDef[] = [
  { id: 'glasses', name: 'Grandma’s Glasses', price: 20, boost: ['bidsBig', 'leadsStrong'], note: '' },
  { id: 'lemonade', name: 'Cold Lemonade', price: 30, boost: ['lovesZero', 'savesSpades'], note: '' },
  { id: 'notebook', name: 'Score Notebook', price: 30, boost: ['bidsBig', 'avoidsExtras'], note: '' },
  { id: 'tongs', name: 'BBQ Tongs', price: 40, boost: ['savesSpades', 'wontSteal'], note: '' },
  { id: 'sunhat', name: 'Sun Hat', price: 40, boost: ['lovesZero', 'leadsStrong'], note: '' },
  { id: 'nose', name: 'Clown Nose', price: 15, boost: ['bidsBig', 'lovesZero'], note: 'Honk. Bids bolder and goes zero more often.' },
  { id: 'stache', name: 'Fake Mustache', price: 25, boost: ['wontSteal', 'avoidsExtras'], note: 'Looks very trustworthy. Steals less, avoids extras.' },
  { id: 'chicken', name: 'Rubber Chicken', price: 35, boost: ['leadsStrong', 'savesSpades'], note: 'Squeaks when he leads. Leads strong and saves spades.' },
  { id: 'mirror', name: 'Cheater’s Mirror', price: 1000, boost: [], once: true, note: 'One look at everyone’s cards, one time. It’s used up when you peek.' },
  { id: 'clover', name: 'Lucky Clover', price: 60, boost: [], lucky: true, note: 'Adds +1 to the partner’s lowest stat. Same every game — no dice.' },
];

export const itemById = (id: string | null | undefined): ItemDef | null =>
  (id && ITEMS.find((i) => i.id === id)) || null;

export const boostedKeys = (p: PartnerDef, item: ItemDef | null): StatKey[] => {
  if (!item) return [];
  if (item.lucky) {
    let lo = STAT_ORDER[0];
    for (const k of STAT_ORDER) if (p.stats[k] < p.stats[lo]) lo = k;
    return [lo];
  }
  return item.boost;
};

export const effectiveStats = (p: PartnerDef, item: ItemDef | null): Stats => {
  const keys = boostedKeys(p, item);
  const out = { ...p.stats };
  for (const k of keys) out[k] = Math.min(5, out[k] + 1);
  return out;
};

export const partnerFirstName = (id: string): string => {
  const p = PARTNERS.find((x) => x.id === id);
  if (!p) return '';
  const parts = p.name.split(' ');
  return parts[parts.length - 1];
};
