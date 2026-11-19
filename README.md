# Backyard Spades

Pick a family partner, promise your rounds, win the backyard. Points only — no real-money gambling, no accounts, on-device storage.

Design brief (the contract): `~/workspace/your_files/backyard-spades-design-spec/BACKYARD-SPADES-DESIGN-BRIEF.md`

## Run

```bash
npm install
npx expo start --web        # web (fully playable)
npm test                    # Jest — 49 tests
npm run typecheck           # tsc --noEmit
npm run lint                # expo lint
npm run build:web           # expo export --platform web → dist/
```

## What's in v1

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
