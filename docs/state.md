# State
_Last updated: 2026-05-01 2118_

## Current focus
Versus polish pass: stacked lobby roster + multiplayer death attribution that names the killing source (asteroid, Regent enemy/beam, boss beam, or the specific pilot's laser/enemy).

## What's working
- `NetSession` exposes 2-4 player roster helpers, active room cap, all-ready checks, active-roster host logic, and stable room colors.
- Main-menu Versus lobby displays a pilot roster and enables READY for active rooms with 2-4 pilots.
- Versus launches directly from the lobby countdown into gameplay.
- `GameScene` forces Versus mission list to empty and suppresses company liaison setup.
- Players in Versus get a room color based on active roster order.
- Versus laser / enemy-spawn payloads carry sender ids, target ids (omitted in 3-4p broadcast), and sender color.
- Incoming player-spawned lasers and enemies render in the sender's color.
- 1v1 path keeps the existing one-opponent spectate / death screen / repulsor flow.
- 3-4 player terminal state shows live standings and broadcast laser/enemy controls (10s laser regen, 20s enemy regen).
- 3-4 player resolves to a final ranked `FINAL STANDINGS` result table once every pilot has extracted or died (including disconnects, which are treated as DESTROYED with last known score).
- Live arena now renders color-coded ghost ships for every other pilot in 3-4 player Versus; 1v1 ghost is unchanged.
- Lobby roster renders pilots stacked vertically (one per line) with hint + button rows reflowed below.
- Multiplayer deaths record a killer descriptor (`ASTEROID`, `REGENT ENEMY`, `REGENT BEAM`, `BOSS BEAM`, `<PILOT> LASER`, `<PILOT> ENEMY`) and the result UIs (1v1 column + multi-pilot standings row) show it.
- `npm.cmd run build` passes.

## In progress
- Compact in-run opponent status cards (live HUD chips, not just standings while terminal).

## Known issues
- Multi-pilot final result has no rematch button yet; only MENU. Rematch UX still 1v1-only.
- Multi-pilot spectate (after local terminal, before all-terminal) still shows the standings table with the primary peer's spectate mirror behind a heavy dim — readable but not redesigned.
- MissionSelect still contains old Versus briefing code, but the active Versus route no longer enters it.
- Repulsors stay effectively 1v1-only for now; 3-4 player terminal controls use laser + enemy.
- The old `VersusLobbyScene` still exists in the scene list but is no longer entered from the main menu.
- Main menu embedded Versus room UI needs a live compact-mobile visual check.
- Multi-window Versus flow needs a smoke test: create/join, ready countdown, direct deploy, terminal scoreboard, broadcast laser/enemy, final ranked result, ghost ships visible.
- Pocket mode is intentionally disabled in versus; no mirror/sync support was added for it.
- Versus-mode mirror does not render bosses.
- Manual Supabase SQL migration for `mode` / `company_id` columns still pending (`docs/sql/2026-04-28 1403 mode and company_id columns.sql`).

## Next actions
1. Smoke-test 3-4 browser sessions for ghost ship visibility and final ranked result transition.
2. Add compact live opponent status cards for 3-4 player rooms while alive.
3. Design a multi-pilot rematch flow.

## Active plan
docs/plans/2026-05-01 2042 Plan revision - Four Player Death Screen.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run dev -- --host 0.0.0.0`
3. 1v1: existing death/spectate/laser/repulsor flow still works.
4. 3-4 player live: each pilot sees the others as colored ghost ships overlaid on their own arena while playing.
5. 3-4 player terminal: each pilot's death/extract still shows live standings with broadcast laser/enemy.
6. 3-4 player resolution: once every pilot has extracted or died, the screen switches to a `FINAL STANDINGS` ranked table.
7. 3-4 player disconnect: a pilot leaving mid-match no longer prevents the remaining pilots from resolving — leaver is shown as DESTROYED with their last known score.

## Recent logs
- docs/log/2026-05-01 2118 Lobby Stack and Killer Attribution.md - stacked lobby roster vertically and added multiplayer death attribution (per-killer descriptor) end-to-end.
- docs/log/2026-05-01 2100 Multi Pilot Win State and Ghost Ships.md - added all-pilot terminal resolve, multi-pilot final ranked result UI, and color-coded ghost ships for every peer in the local live arena.
- docs/log/2026-05-01 2052 Multi Pilot Broadcast Sabotage.md - added player colors, colored broadcast lasers, colored broadcast enemy spawns, and 3-4 player terminal scoreboard controls.
- docs/log/2026-05-01 2042 Four Player Death Screen Direction.md - captured scoreboard-first 3-4 player death screen and preserved 1v1 spectate direction.
- docs/log/2026-05-01 2039 Multi Pilot Ready Enable.md - enabled READY for 2-4 active pilots and tagged runtime messages with sender/target ids.
- docs/log/2026-05-01 2031 Direct Versus Deploy.md - bypassed MissionSelect for Versus and forced plain no-mission/no-company gameplay.
