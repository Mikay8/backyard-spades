# Backyard Spades

Pick a family partner, promise your rounds, win the backyard. Points only — no real-money gambling, no accounts, on-device storage.

Design brief (the contract): `~/workspace/your_files/backyard-spades-design-spec/BACKYARD-SPADES-DESIGN-BRIEF.md`

## Run

```bash
npm install
npx expo start --web        # web (fully playable)
npm test                    # Jest — 55 tests
npm run typecheck           # tsc --noEmit
npm run lint                # expo lint
npm run build:web           # expo export --platform web → dist/
```

## What's in v1

- Coin Shop (`/coins`, tap Coins on Home): four Coin packs with **mock** USD prices (`src/constants/shop.ts`). No payment is taken yet: confirming a pack just adds its Coins. Real purchases (App Store / Google Play in-app purchases, Stripe on the web) would replace the confirm step.
- Shed items live under the partner card on Pick Your Partner (`components/ItemShelf.tsx`); `/shed` redirects there. Short of Coins → "Get Coins" opens the Coin Shop. Settings is the gear top-right on Home.

- Partner balance: you get what you pay for. Each partner has a card skill (free: Normal; Marcus, Mom, Dad, Mae: Hard; Grandpa, Rank 15 / 200 Coins: Expert) and dots tuned by simulation. `npm run balance` plays seeded games for every partner and fails if a pricier tier wins less often than a cheaper one (last run, Normal opponents: free ~44%, 25 Coins ~51%, 60 ~55%, 120 ~59%, Grandpa ~63%).
- Promises: the hand estimate is fitted to ~11,600 simulated hands (the old count of aces + high spades underestimated by ~1.6 rounds), and a good promise sits 0.5 under it. 3 Bids Big dots promise exactly that; more or fewer dots over- or under-promise, and both cost games.

- Difficulty (Settings → Game): Easy / Normal / Hard / Expert opponents, win pays 20 / 30 / 45 / 60 Coins. Your rank sets the minimum (Easy 1–4, Normal 5–9, Hard 10–14, Expert 15+); you can pick harder, never easier. `src/constants/difficulty.ts`.
- The AI plays from the stat dots (`src/engine/ai.ts`): each dot value is a chance (e.g. Won't Steal 2 → takes your covered round ~75% of the time), item ◆ boosts included. Opponents use balanced dots plus a skill layer (Easy blunders, Hard counts cards / leads winners / second-hand low, Expert also hunts go-zero). Chances come from a per-game seed, so a game is reproducible.

- Visual design: the "Family Card Night — 16-bit Pixel Art" design canvas — Press Start 2P + Nunito, ink outlines with hard shadows, wood-framed pixel portraits, pixel playing cards, phone-width layout centred on wide screens. Shared kit in `src/components/ui.tsx`, table pieces in `src/components/Table.tsx`.
- The Shed (`/shed`): buy items with Coins, equip one per partner (+1 to one or two stats, shown as ◆ and drawn on the portrait); Cheater's Mirror gives a one-time peek at every hand in a game. Partner detail screen (`/partner`). Item stat boosts are display-only — the AI still plays from base stats.

- Home, Pick Your Partner (8 family partners), Game Table (first to 500, deals of 13 rounds), Deal-Score sheet, Game Result (Coins + XP + rank, share text), Interactive Tutorial (Steps 1–10, fixed example deal), How to Play, Family, Settings, Rank detail.
- Scoring exactly per brief §8; partner quirks are deterministic rules, not luck; rank + Coins exactly per §10; plain language per §11 (promise / round / "Spades beat everything" / extras / go zero).
- Opponents: Bill (left) and a Neighbour (right) — proposal, brief §21 left opponent identity open.
- App icon: Mikayla's `plain2-1024.png` (navy pixel spade on picnic check). See `scripts/build_app_icon.py`, which composes `assets/icon.png`, the Android adaptive icon, splash icon, and favicon from it. The in-app wordmark renders the icon from a base64 data URI (`src/assets/images.ts`).

## Binary assets — read before pushing

`assets/icon.png` and the composed files under `assets/images/` (`android-icon-*.png`, `splash-icon.png`, `favicon.png`, `icon-source.png`) plus the pixel-art PNGs in `assets/images/` are **binary and cannot be pushed through the GitHub connector** (see `~/AGENTS.md`). They live in the local tree only. The app itself renders images from base64 data URIs in `src/assets/images.ts` (verified: each URI decodes to the original bytes, SHA-256 in the file), so the TypeScript source is pushable; the PNGs need a push path that carries binaries (git push from a machine with credentials, or the GitHub web UI). **Do not let this block the rest of the build or the tests/export.**

Also note: the repo `Mikay8/backyard-spades` is **public**, not private like Flapjack21.

## Known deviations from the brief (all flagged, none silent)

- Tutorial Step 5: the brief has Left lead the King of diamonds AND Grandma play it — one card can't be in two hands, and Left holds no King of diamonds. Grandma (who won round 4) leads it instead; Left follows with the 3 of diamonds. Lesson unchanged.
- Tutorial Step 5: Right plays the 3 of spades, not the 2 — the 2 of spades is Left's card.
- Tutorial Step 7: the brief says "Right leads the Ace of diamonds", but Right holds no diamonds and you still hold the 7 and 6 of diamonds. Left (who won round 6) leads the 7 of spades; your Ace of spades still wins the round.
- Tutorial Step 8: the brief's stated outcome ("promised 7, won 8 — +71") does not match a real AI playthrough of the remaining rounds (verified: won 6 → -70). The tutorial shows the real computed numbers instead of the brief's number.
- Scoring: a go-zero player's rounds do not count toward the team promise — brief §8.2 proves it (June wins 1, team made 6 → -40, not -39). Implemented that way in `src/engine/game.ts` (`teamWon`).
- Bundle IDs (`game.backyardspades.app`) are a proposal, not decided.
- Palette follows the brief §15 proposal (backyard at golden hour); Mikayla has not locked colours.

## Development environment (Railway) — dev-only infinite Coins

Branching mirrors Flapjack21: feature work lands on `develop`, which the
Railway **development** environment deploys; merging `develop` → `main`
ships to the production URL. Never merge dev-only behaviour to `main`
without checking it is flag-gated.

The development build sets one extra service variable:

- `EXPO_PUBLIC_DEV_UNLOCK_ALL=1` (+ `CI=true`, same as production)

What it does (`src/constants/devmode.ts`, flag-gated, no in-app switch):

- Every partner is owned from the start, so all 8 can be play-tested
  without grinding rank + Coins. Buying a partner is free and ignores
  rank gates; Shed items are covered by a 999,999-Coin dev balance
  (all partners 505 + all items ~355 + Cheater's Mirror 1000).
- Coins display as ∞ on Home, Family, Shed, Result and the Buy sheet,
  with a purple "DEV BUILD - UNLIMITED COINS, ALL PARTNERS UNLOCKED"
  badge on Home, Pick, Family and Shed so the dev build is unmistakable.
- **Rank choosing (Settings → Development, dev only):** a − / + stepper
  plus Rank 1 / 5 / 10 / 15 jumps set your rank for testing (Rank 5: see
  the partner's promise; Rank 10: favourite + review; Rank 15: table
  themes + card backs). Implemented as `setRank` in the store (XP set to
  the start of the chosen rank via `xpForRank`); it no-ops when the flag
  is off, and the whole section renders only in the dev build.

Why production is safe: Expo inlines `EXPO_PUBLIC_*` variables into the
bundle at build time, and the production environment never sets this
variable — verified: a build without it compiles the flag to a literal
`false` (`DEV_UNLOCK_ALL` getter returns `!1` in the bundle). **Never
set `EXPO_PUBLIC_DEV_UNLOCK_ALL` on the production service.**
