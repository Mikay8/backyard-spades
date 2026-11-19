// Development-only unlock — DEV ONLY, never production.
//
// Set EXPO_PUBLIC_DEV_UNLOCK_ALL=1 as a variable on the Railway
// *development* environment only. Expo inlines EXPO_PUBLIC_* variables
// into the bundle at build time, so a build only sees the flag when its
// own environment sets it: the production environment never sets it, so
// the production build always sees `undefined` here and plays exactly
// like the real game (partners locked by rank + Coins, Coins counted).
//
// When the flag is on: every partner is owned from the start, buying
// never charges or checks rank, and Coins display as ∞. There is no
// in-app switch for this — it is purely a build-time environment flag,
// so it cannot be turned on from the shipped app.
export const DEV_UNLOCK_ALL = process.env.EXPO_PUBLIC_DEV_UNLOCK_ALL === '1';

/** Dev-only starting balance — big enough to buy everything (all partners
 *  505 Coins, all Shed items ~355, Cheater's Mirror 1000) many times over.
 *  The display shows ∞ instead of this number (see coinsText in ui.tsx). */
export const DEV_COINS = 999999;
