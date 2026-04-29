# State
_Last updated: 2026-04-29 0923_

## Current focus
Mirrored versus multiplayer MVP. Phase 1 (lobby + ready handshake), Phase 2 (10Hz snapshot pipeline), and Phase 3 (mirror PIP viewport with arena-fraction normalization + two-snapshot interpolation) are now landed. Phase 4 (extract/death events + side-by-side result screen) is the next slice.

## What's working
- `src/game/scenes/BootScene.ts`: minimal critical path, 100ms forced hold, no font readiness gate.
- `src/game/systems/MusicSystem.ts`: trimmed boot-time preload (`menuSynth`, `bassOne`, `drumsTwo`); deferred stems warm post-menu and seek-align to current gameplay reference stem.
- `src/game/scenes/MenuScene.ts`: single mode toggle cycles `ARCADE`, `CAMPAIGN`, `VERSUS`. Arcade shows weekly `PILOTS` / `CORPS` boards, campaign shows local campaign board, versus shows matchmaking status panel.
- `src/game/scenes/VersusLobbyScene.ts`: 4-char alphanumeric room codes, READY toggle, host-broadcast countdown, handoff into `GameScene`.
- `src/game/systems/NetSystem.ts`: Supabase Realtime channel wrapper with presence + late-bindable broadcast listeners + deterministic host election (playerId string compare).
- `src/game/scenes/GameScene.ts`: 10Hz `MirrorSnapshot` send/receive both directions; mirrored-versus runs force `RunMode.VERSUS`, block score recording/payouts, and use versus-specific result copy. New mirror PIP in bottom-right of arena renders peer ship (triangle) + enemies (circles) as low-alpha ghost sprites, interpolated between last two snapshots over a 100ms buffered render clock; shows `WAITING` until first snapshot lands.
- Snapshot wire format uses arena-relative fractions for ship + enemy x/y, so peers on different viewport sizes still align in the mirror.
- `src/game/scenes/MissionSelectScene.ts`: company rows still show each corp's run perk; line omits the extra `BOOST //` prefix.
- Affiliation boosts wired into gameplay: Deepcore mining yield, Reclaim salvage yield, Iron Veil banked-score multiplier, Freeport drop-rate bonus.
- `npm.cmd run build`: passes.

## In progress
- Phase 4 of the versus plan (extract/death events + result screen + match-end logic) has not started.
- Manual Supabase SQL migration for `mode` / `company_id` columns is still pending (`docs/sql/2026-04-28 1403 mode and company_id columns.sql`).
- Cold-refresh phone playtest of the latest startup trim is still pending.

## Known issues
- **Supabase migration required**: `scores` / `losses` need nullable `mode` columns; corp-tagged rows need nullable `company_id`. Until applied, write calls strip unsupported fields and arcade leaderboard reads fall back to legacy mixed rows.
- Company bonus values are scaffolding-only (`+15/+30/+50%`, `+10/+20/+30%`-style tiers). Visibility/copy is cleaner, but tuning still needs a later pass.
- Late-load beat-alignment path is build-verified only, not playtested on real phone (Safari, low-end Android).
- Soft respawn keeps rep-flux income accumulators across lives, so pre-death mining/salvage income can still count toward RECLAIM/DEEPCORE rep at run end.
- Rep-flux tuning placeholders remain: `salvageCreditsPerRep:200`, `miningCreditsPerRep:200`, `ironVeilKillsPerRep:5`, `ironVeilRivalRepCostPerKill:1`, `ironVeilRivalRepCostCapPerRun:3`, `freePortExtractRep:1`, `freePortDeathRep:2`.
- Versus mode is trust-based; no anti-cheat. Leaderboard/payout blocking enforced for mirrored runs, but versus still has no dedicated result/reporting layer beyond current no-records messaging.
- Mirror PIP enemy ghosts are pair-matched by array index. Mid-snapshot reorder can shimmer for one frame. Stable enemy IDs is Phase 6 polish.
- Mirror PIP currently stays visible during the result screen (teardown only fires in `cleanup()`). Hide on `state === RESULTS` if it overlaps result UI in playtest.

## Next actions
1. Phase 4 of the versus plan: broadcast `extract` / `death` events on terminal state, side-by-side result screen, decide match-end condition (both terminal OR extract + death).
2. Run the pending Supabase SQL migration for `mode` / `company_id`.
3. Tap-through test the three-state menu selector + the new mirror PIP on desktop and phone-sized viewports.

## Active plan
docs/plans/2026-04-28 2304 Plan - Mirrored Versus Multiplayer.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run dev`, open two browser windows on the printed URL.
3. Cycle the menu mode selector to `VERSUS`, START → Create Room (window A) → Join Room (window B with the code) → both READY → countdown → both land in `GameScene`.
4. Confirm each window shows the other's ghost ship + enemy dots in a small bottom-right PIP, moving smoothly. Score / phase update in the PIP label.

## Recent logs
- docs/log/2026-04-29 0923 Versus Multiplayer Phase 3 Mirror Viewport.md — replaced debug peer HUD with mirror PIP viewport; added arena-fraction normalization + two-snapshot interpolation.
- docs/log/2026-04-29 0002 Removed Boost Prefix from Company Perks.md — removed the `BOOST //` prefix from Mission Select company perk lines.
- docs/log/2026-04-28 2355 Versus Mode Folded Into Selector.md — moved versus into the shared mode selector, removed the dedicated menu button, and blocked mirrored runs from score/payout paths.
- docs/log/2026-04-28 2347 Single Mode Toggle.md — collapsed separate campaign/arcade mode tabs into one toggle while preserving mode-specific leaderboard swaps.
- docs/log/2026-04-28 2345 Versus Multiplayer Phases 1 and 2.md — landed lobby + ready handshake (Phase 1) and 10Hz snapshot pipeline (Phase 2).
