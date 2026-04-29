# State
_Last updated: 2026-04-29 1647_

## Current focus
Versus design pass landed all five plan phases (A-E) plus the spectate disruption follow-up. Rematch ghost-ship bug is fixed via snapshot epoch. Extract is required to win - non-extract = DRAW. Versus runs route through MissionSelect with each side picking its own contracts/favors/affiliation, then both players lock in before deploy. The versus lobby now uses the same inactive arena backdrop style as the main menu instead of a flat screen.

## What's working
- `src/game/systems/NetSystem.ts`: snapshot epoch field plus `MATCH_LASER`, `MATCH_PING`, `MATCH_BRIEFING_READY`, and `MATCH_DEPLOY` events with payload types.
- `src/game/scenes/GameScene.ts` rematch path: receiver discards stale-epoch snapshots - peer ship no longer freezes at prior round's extract location.
- `src/game/scenes/GameScene.ts` versus resolver: extract-required win, non-extract resolves to DRAW.
- `src/game/scenes/GameScene.ts` post-run flow: fullscreen spectate of the peer's live arena, with spectator laser-charge regen, six selectable strike lanes, and cosmetic peer pings.
- `src/game/entities/VersusLaserPickup.ts` + `src/game/entities/VersusLaserStrike.ts`: versus sabotage laser. Drops from enemy/NPC kills (8% / 4%), broadcasts any of 6 lanes, and on the receiver side now clears the local player, receiver-side NPCs, enemies, asteroids, and powerups directly in the struck lane.
- `src/game/scenes/VersusLobbyScene.ts`: repeated enter -> BACK -> re-enter -> BACK now returns to the main menu correctly, and the lobby now renders the same starfield + geo-sphere + drifting inactive arena backdrop pattern as the main menu.
- `src/game/scenes/MenuScene.ts` and `src/game/scenes/VersusLobbyScene.ts`: menu -> versus lobby -> menu and versus lobby -> MissionSelect now carry background handoff state so the inactive arena feels continuous between screens.
- `src/game/scenes/MissionSelectScene.ts`: versus mode shows `LOCK IN` / `UNLOCK` plus peer status; both locked -> host fires `MATCH_DEPLOY` -> both transition to GameScene with their own loadout. If the peer disconnects during briefing, the local player auto-unlocks and the status pill flips to `LEFT`.
- `src/game/data/tuning.ts`: sabotage laser and spectate inventory values are data-driven (`VERSUS_LASER_WARNING_MS = 900`, `VERSUS_LASER_LETHAL_MS = 500`, `SPECTATE_LASER_REGEN_MS = 5000`, `SPECTATE_LASER_MAX_CHARGES = 3`, `SPECTATE_PING_COOLDOWN_MS = 1000`).
- `npm.cmd run build`: passes.

## In progress
- Manual two-window dev playtest of the full versus flow: lobby -> MissionSelect briefing lock-in -> game -> sabotage drops -> spectate disruptions -> result -> rematch.
- Visual/readability pass on the upgraded versus lobby backdrop and panel treatment.
- Balance/readability follow-up on spectate disruption cadence, charge cap, ping visibility, lane clear feel, and edge-button crowding.

## Known issues
- Current versus flow is TypeScript-build-verified only; no fresh two-window manual playtest after the spectate disruption, lobby backdrop, receiver-side strike-clear, faster regen/telegraph tuning, and briefing auto-unlock changes.
- Palette change inside versus MissionSelect tears down the multiplayer session (`scene.restart` path still breaks the handoff).
- Spectate lane buttons sit on arena edges and may crowd ships or hazards during live play.
- Manual Supabase SQL migration for `mode` / `company_id` columns is still pending (`docs/sql/2026-04-28 1403 mode and company_id columns.sql`).
- Restored arcade/campaign company buffs are still not manually verified or balance-tested.
- Soft respawn keeps rep-flux income accumulators across lives.
- Rep-flux tuning placeholders remain in `tuning.ts`.

## Next actions
1. Manually run a two-window versus session covering: lobby -> MissionSelect briefing lock-in -> game with sabotage drops -> spectate lasers/pings -> result -> rematch.
2. Check the sabotage laser feel live now that spectator charges regen every 5s and the warning telegraph is back down to 900ms.
3. Fix the remaining versus robustness gap: MissionSelect palette restart teardown.

## Active plan
docs/plans/2026-04-29 1432 Plan - Versus Mission Select Sabotage Spectate.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run dev`, open two browser windows. Menu -> Versus should show the same inactive arena backdrop style as the main menu behind the lobby UI.
3. Confirm repeated lobby entry/exit works: Menu -> Versus -> BACK -> Menu -> Versus -> BACK should return to Menu both times.
4. Host + join versus -> both READY -> both land in MissionSelect with `LOCK IN` button and peer status. Lock in on one side, then close/disconnect the other side during briefing.
5. Confirm the locked side auto-unlocks immediately and the peer status updates to `LEFT` instead of leaving the player stranded in a locked state.
6. Resume a normal two-player briefing flow and confirm both locked -> deploy still works.
7. Confirm sabotage laser pickups drop from enemy/NPC kills (violet), pickup -> cooldown -> peer's screen sees a telegraphed lane sweep that clears the struck local lane of the player, receiver-side NPCs, enemies, asteroids, and pickups.
8. While spectating, confirm laser charges regen every 5 seconds up to the cap.

## Recent logs
- docs/log/2026-04-29 1647 Versus Briefing Peer Disconnect Auto-Unlock.md - MissionSelect now listens to peer presence during versus briefing and auto-unlocks if the peer drops.
- docs/log/2026-04-29 1644 Spectator Laser Regen and Warning Retune.md - sped spectator laser charge regen up to 5s and shortened the sabotage warning telegraph back to 900ms.
- docs/log/2026-04-29 1641 Versus Laser Receiver-Side Arena Clear.md - sabotage laser now clears receiver-side asteroids, enemies, NPCs, and all pickup types in addition to the local player.
