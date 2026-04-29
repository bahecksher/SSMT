# State
_Last updated: 2026-04-29 0002_

## Current focus
Mirrored versus multiplayer MVP remains the active plan: two players run full local sims, exchange low-fidelity arena snapshots, and resolve on extract/death by score compare via Supabase Realtime broadcast channels.

Small targeted detour landed this session: the Mission Select company perk lines no longer prepend the word `BOOST`, so each corporation row now just shows the perk text itself.

## What's working
- `src/game/scenes/BootScene.ts`: minimal critical path, 100ms forced hold, no font readiness gate.
- `src/game/systems/MusicSystem.ts`: trimmed boot-time preload (`menuSynth`, `bassOne`, `drumsTwo`); deferred stems warm post-menu and seek-align to the current gameplay reference stem.
- `src/game/scenes/MenuScene.ts`: one mode toggle now cycles `ARCADE`, `CAMPAIGN`, and `VERSUS`; arcade still shows the weekly `PILOTS` / `CORPS` boards, campaign still shows the local campaign board, and versus now shows a matchmaking status panel instead of a separate menu button.
- `src/game/scenes/VersusLobbyScene.ts`: menu start now routes into the versus lobby when `VERSUS` is selected.
- `src/game/scenes/GameScene.ts`: mirrored-versus runs force `RunMode.VERSUS`, block score recording/payouts, and use versus-specific result copy instead of debug wording.
- `src/game/scenes/MissionSelectScene.ts`: company rows still show each corp's run perk, but the visible perk line now omits the extra `BOOST //` prefix.
- Affiliation boosts are still wired into gameplay: Deepcore mining yield, Reclaim salvage yield, Iron Veil banked-score multiplier, Freeport drop-rate bonus.
- `npm.cmd run build`: passes.

## In progress
- Versus plan is active; lobby/menu entry is present, but the full mirrored match loop still needs continued integration/testing in this workspace snapshot.
- Cold-refresh phone playtest of the latest startup trim is still pending from the previous focus.
- Manual Supabase SQL migration for `mode` / `company_id` columns is still pending (see `docs/sql/2026-04-28 1403 mode and company_id columns.sql`).

## Known issues
- **Supabase migration required**: `scores` / `losses` need nullable `mode` columns; corp-tagged rows need nullable `company_id`. Until applied, write calls strip unsupported fields and arcade leaderboard reads fall back to legacy mixed rows.
- Company bonus values are still scaffolding-only numbers (`+15/+30/+50%`, `+10/+20/+30%` style tiers). Visibility/copy is cleaner, but tuning still needs a later pass.
- Late-load beat-alignment path is build-verified only, not playtested on real phone (Safari, low-end Android).
- Soft respawn keeps rep-flux income accumulators across lives, so pre-death mining/salvage income can still count toward RECLAIM/DEEPCORE rep at run end.
- Rep-flux tuning placeholders remain: `salvageCreditsPerRep:200`, `miningCreditsPerRep:200`, `ironVeilKillsPerRep:5`, `ironVeilRivalRepCostPerKill:1`, `ironVeilRivalRepCostCapPerRun:3`, `freePortExtractRep:1`, `freePortDeathRep:2`.
- Versus mode is fully trust-based; no anti-cheat. Leaderboard/payout blocking is now enforced for mirrored runs, but versus still has no dedicated result/reporting layer beyond the current no-records messaging.

## Next actions
1. Resume the mirrored versus plan inside `src/game/systems/NetSystem.ts` / `GameScene.ts`, especially match resolution and opponent outcome handling.
2. Run the pending Supabase SQL migration for `mode` / `company_id`.
3. Tap-through test the Mission Select company panel and the three-state menu selector on desktop and phone-sized viewports.

## Active plan
docs/plans/2026-04-28 2304 Plan - Mirrored Versus Multiplayer.md

## How to verify
1. `npm.cmd run build`
2. Open Mission Select and confirm each company row still shows its perk, but without the `BOOST` prefix.
3. Confirm the rest of the company row layout still fits correctly on compact/mobile-sized screens.

## Recent logs
- docs/log/2026-04-29 0002 Removed Boost Prefix from Company Perks.md — removed the `BOOST //` prefix from Mission Select company perk lines.
- docs/log/2026-04-28 2355 Versus Mode Folded Into Selector.md — moved versus into the shared mode selector, removed the dedicated menu button, and blocked mirrored runs from score/payout paths.
- docs/log/2026-04-28 2347 Single Mode Toggle.md — collapsed separate campaign/arcade mode tabs into one toggle while preserving mode-specific leaderboard swaps.
- docs/log/2026-04-28 2319 Company Bonus Card Clarity.md — restored visible corporation bonus copy on MissionSelect cards without changing balance.
- docs/log/2026-04-28 2309 Versus Multiplayer Plan Active.md — swapped active plan to mirrored versus multiplayer; ship plan paused.
