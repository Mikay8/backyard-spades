// Everyone who can sit at the table. Each game draws two opponents at random
// from this cast (never your partner); they keep their seats for the game.
// Family members play with their own stat dots; Grandpa Bill has his own;
// the neighbours are balanced.
import { PARTNERS, type Stats } from './partners';

export interface CastMember {
  id: string;
  name: string;
  /** Short name for seat tags and status lines ("Dre", "Grandma"). */
  short: string;
  /** Portrait file stem (see src/assets/images.ts). */
  portrait: string;
  /** Personality dots; null = balanced. */
  stats: Stats | null;
}

const shortName = (name: string) => (name === 'Grandma Rose' ? 'Grandma' : name.split(' ').pop() ?? name);

export const CAST: CastMember[] = [
  ...PARTNERS.map((p) => ({ id: p.id, name: p.name, short: shortName(p.name), portrait: p.portrait, stats: p.stats })),
  {
    id: 'bill',
    name: 'Grandpa Bill',
    short: 'Bill',
    portrait: 'bill',
    // From the design canvas: forgetful, plays a bit loose.
    stats: { bidsBig: 3, savesSpades: 2, wontSteal: 3, avoidsExtras: 3, lovesZero: 3, leadsStrong: 4 },
  },
  { id: 'nbrL', name: 'Neighbour Gus', short: 'Gus', portrait: 'p-nbrL', stats: null },
  { id: 'nbrR', name: 'Neighbour Rita', short: 'Rita', portrait: 'p-nbrR', stats: null },
];

export const castById = (id: string): CastMember => CAST.find((c) => c.id === id) ?? CAST[CAST.length - 1];

/** Two different opponents for a game, never the player's partner. `rand` returns [0,1). */
export const pickOpponents = (partnerId: string, rand: () => number): [string, string] => {
  const pool = CAST.filter((c) => c.id !== partnerId).map((c) => c.id);
  const a = pool.splice(Math.floor(rand() * pool.length) % pool.length, 1)[0];
  const b = pool[Math.floor(rand() * pool.length) % pool.length];
  return [a, b];
};
