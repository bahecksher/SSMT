# State
_Last updated: 2026-04-29 1621_

## Current focus
Versus design pass landed all five plan phases (A-E) plus the spectate disruption follow-up. Rematch ghost-ship bug is fixed via snapshot epoch. Extract is required to win - non-extract = DRAW. Versus runs route through MissionSelect with each side picking its own contracts/favors/affiliation, then both players lock in before deploy. Post-run spectate now gives the waiting player regenerating sabotage laser charges and ping markers instead of passive watching only.

## What's working
- `src/game/systems/NetSystem.ts`: snapshot epoch field plus `MATCH_LASER`, `MATCH_PING`, `MATCH_BRIEFING_READY`, and `MATCH_DEPLOY` events with payload types.
- `src/game/scenes/GameScene.ts` rematch path: receiver discards stale-epoch snapshots - peer ship no longer freezes at prior round's extract location.
- `src/game/scenes/GameScene.ts` versus resolver: extract-required win, non-extract resolves to DRAW.
- `src/game/scenes/GameScene.ts` post-run flow: fullscreen spectate of the peer's live arena, with spectator laser-charge regen, six selectable strike lanes, and cosmetic peer pings.
- `src/game/entities/VersusLaserPickup.ts` + `src/game/entities/VersusLaserStrike.ts`: versus sabotage laser. Drops from enemy/NPC kills (8% / 4%), broadcasts any of 6 lanes, and renders a 1.5s warning plus 0.5s lethal sweep on the peer's screen.
- `src/game/entities/VersusPingMarker.ts`: cosmetic ping marker for spectator taps on the peer mirror.
- `src/game/scenes/VersusLobbyScene.ts`: lobby READY routes both peers to MissionSelect with `RunMode.VERSUS`.
- `src/game/scenes/MissionSelectScene.ts`: versus mode shows `LOCK IN` / `UNLOCK` plus peer status; both locked -> host fires `MATCH_DEPLOY` -> both transition to GameScene with their own loadout.
- `src/game/data/tuning.ts`: sabotage laser and spectate inventory values are data-driven (`VERSUS_LASER_WARNING_MS = 1500`, `SPECTATE_LASER_REGEN_MS = 15000`, `SPECTATE_LASER_MAX_CHARGES = 3`, `SPECTATE_PING_COOLDOWN_MS = 1000`).
- `npm.cmd run build`: passes.

## In progress
- Manual two-window dev playtest of the full versus flow: lobby -> MissionSelect briefing lock-in -> game -> sabotage drops -> spectate disruptions -> result -> rematch.
- Balance/readability follow-up on spectate disruption cadence, charge cap, ping visibility, and edge-button crowding.

## Known issues
- Current versus flow is TypeScript-build-verified only; no fresh two-window manual playtest after spectate disruption changes.
- Palette change inside versus MissionSelect tears down the multiplayer session (`scene.restart` path still breaks the handoff).
- Peer-disconnect during briefing leaves the locked player waiting; no auto-unlock yet.
- Sabotage laser strikes still only target the local player on the receiver side; they do not clear receiver-side NPCs, enemies, or asteroids.
- Spectate lane buttons sit on arena edges and may crowd ships or hazards during live play.
- Manual Supabase SQL migration for `mode` / `company_id` columns is still pending (`docs/sql/2026-04-28 1403 mode and company_id columns.sql`).
- Restored arcade/campaign company buffs are still not manually verified or balance-tested.
- Soft respawn keeps rep-flux income accumulators across lives.
- Rep-flux tuning placeholders remain in `tuning.ts`.

## Next actions
1. Manually run a two-window versus session covering: lobby -> MissionSelect briefing lock-in -> game with sabotage drops -> spectate lasers/pings -> result -> rematch.
2. Tune spectate disruption feel based on playtest (regen rate, max charges, ping readability, lane button placement).
3. Fix the main versus robustness gaps: MissionSelect palette restart teardown and briefing disconnect wait state.

## Active plan
docs/plans/2026-04-29 1432 Plan - Versus Mission Select Sabotage Spectate.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run dev`, open two browser windows. Host + join versus -> both READY -> both land in MissionSelect with `LOCK IN` button and peer status. Lock in on both -> both transition to GameScene with their own selected missions/favors.
3. Confirm sabotage laser pickups drop from enemy/NPC kills (violet), pickup -> cooldown -> peer's screen sees a telegraphed lane sweep.
4. Confirm that when one player ends and the other is still alive, the waiting player enters fullscreen spectate with charge regen, lane buttons for all 6 strike lanes, and tap-to-ping markers on the peer mirror.
5. Confirm rematch keeps peer ship animated correctly on round 2+ (no freeze at prior extract coords).
6. Confirm DRAW outcomes when both die regardless of score.

## Recent logs
- docs/log/2026-04-29 1519 Spectate Disruption Inventory.md - spectate-side laser charges, pings, and vertical lane lasers.
- docs/log/2026-04-29 1508 Versus MissionSelect Briefing Routing.md - Phase E: lobby -> MissionSelect -> lock-in -> deploy via new `MATCH_BRIEFING_READY` and `MATCH_DEPLOY` events.
- docs/log/2026-04-29 1459 Versus Sabotage Laser Power-Up.md - Phase D: versus-only sabotage laser pickup + receiver lane sweep.
