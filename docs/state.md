# State
_Last updated: 2026-05-01 2052_

## Current focus
Implemented the first 3-4 player terminal sabotage pass: live scoreboard-style terminal screen, room player colors, colored broadcast lasers, and colored broadcast enemy spawns.

## What's working
- `NetSession` exposes 2-4 player roster helpers, active room cap, all-ready checks, active-roster host logic, and stable room colors.
- Main-menu Versus lobby displays a pilot roster and enables READY for active rooms with 2-4 pilots.
- Versus launches directly from the lobby countdown into gameplay.
- `GameScene` forces Versus mission list to empty and suppresses company liaison setup.
- Players in Versus get a room color based on active roster order.
- Local player ship uses its assigned Versus color.
- Versus laser payloads carry `senderId`, `targetId`, and sender color.
- Versus enemy-spawn payloads carry `senderId`, `targetId`, and sender color.
- Incoming player-spawned lasers render in the sender's color.
- Incoming player-spawned enemies render in the sender's color.
- In 3-4 player terminal state, laser sabotage broadcasts to all active pilots instead of one target.
- In 3-4 player terminal state, each terminal player has one laser charge that regenerates every 10s.
- In 3-4 player terminal state, each terminal player has one enemy-spawn charge that regenerates every 20s.
- 1v1 path keeps the existing one-opponent spectate/death-screen style and repulsor control.
- `npm.cmd run build` passes.

## In progress
- 3-4 player results are still rough. Terminal players get a live standings table with score/phase/state, but final ranked result/rematch flow is not fully redesigned yet.

## Known issues
- 3-4 player in-run UI is still incomplete: live players do not yet get compact opponent status cards.
- Multi-player final results need a dedicated ranked table once every pilot is terminal.
- Current 3-4 player terminal screen shows standings and broadcast sabotage, but not target-select spectate.
- MissionSelect still contains old Versus briefing code, but the active Versus route no longer enters it.
- Repulsors stay effectively 1v1-only for now; 3-4 player terminal controls use laser + enemy.
- The old `VersusLobbyScene` still exists in the scene list but is no longer entered from the main menu.
- Main menu embedded Versus room UI needs a live compact-mobile visual check.
- Multi-window Versus flow needs a smoke test: create/join, ready countdown, direct deploy, terminal scoreboard, broadcast laser/enemy, result.
- Pocket mode is intentionally disabled in versus; no mirror/sync support was added for it.
- Versus-mode mirror does not render bosses.
- Manual Supabase SQL migration for `mode` / `company_id` columns still pending (`docs/sql/2026-04-28 1403 mode and company_id columns.sql`).

## Next actions
1. Add compact live opponent status cards for 3-4 player rooms while alive.
2. Add final 2-4 player ranked result table once all pilots are terminal.
3. Smoke-test four browser sessions for READY, direct deploy, death scoreboard, 10s laser recharge, and 20s enemy recharge.

## Active plan
docs/plans/2026-05-01 2042 Plan revision - Four Player Death Screen.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run dev -- --host 0.0.0.0`
3. 1v1: verify the existing death/spectate/laser/repulsor flow still works.
4. 3-4 player: verify each pilot gets a distinct ship color.
5. 3-4 player: kill/extract one player and confirm terminal screen shows all pilots' score/phase/state.
6. 3-4 player: fire LASER and confirm all active pilots receive a laser in the sender's color.
7. 3-4 player: fire ENEMY and confirm all active pilots receive an enemy in the sender's color.

## Recent logs
- docs/log/2026-05-01 2052 Multi Pilot Broadcast Sabotage.md - added player colors, colored broadcast lasers, colored broadcast enemy spawns, and 3-4 player terminal scoreboard controls.
- docs/log/2026-05-01 2042 Four Player Death Screen Direction.md - captured scoreboard-first 3-4 player death screen and preserved 1v1 spectate direction.
- docs/log/2026-05-01 2039 Multi Pilot Ready Enable.md - enabled READY for 2-4 active pilots and tagged runtime messages with sender/target ids.
- docs/log/2026-05-01 2031 Direct Versus Deploy.md - bypassed MissionSelect for Versus and forced plain no-mission/no-company gameplay.
