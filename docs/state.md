# State
_Last updated: 2026-05-02 2220_

## Current focus
Ship-hardening pass interrupted by user request: added multi-pilot rematch (3p/4p) and fixed three smoke regressions surfaced during the matrix walk. Smoke matrix not yet complete — 4p mid-disconnect, death attribution coverage, mobile pass, and solo regression sweep still pending.

## What's working
- `NetSession` exposes 2-4 player roster helpers, active room cap, all-ready checks, active-roster host logic, and stable room colors.
- Main-menu Versus lobby displays a pilot roster and enables READY for active rooms with 2-4 pilots.
- Versus launches directly from the lobby countdown into gameplay.
- `GameScene` forces Versus mission list to empty and suppresses company liaison setup.
- Players in Versus get a room color based on active roster order; color is now cached at match start so disconnects no longer shift remaining pilots' colors.
- Versus laser / enemy-spawn payloads carry sender ids, target ids (omitted in 3-4p broadcast), and sender color.
- 1v1 path keeps the existing one-opponent spectate / death screen / repulsor / rematch flow.
- 3-4 player terminal shows live standings, broadcast laser/enemy controls, and now a REMATCH button next to MENU. Rematch fires when local + all currently-present peers are READY; disconnected peers no longer block rematch.
- 3-4 player resolves to a final ranked `FINAL STANDINGS` result table.
- Live arena renders color-coded ghost ships for every other pilot in 3-4 player Versus.
- Lobby roster renders pilots stacked vertically; multi-pilot text is now top-anchored so it grows downward instead of crowding the room code line.
- Multiplayer deaths record a killer descriptor; result UIs (1v1 column + multi-pilot standings row) show it.
- Spectate-fired sabotage laser no longer paints a self-fire echo onto the multi-pilot terminal mirror.
- MenuScene scene-reuse crash on return from GameScene fixed (updateModeTabStyles now runs after primaryActionText creation).
- `npm.cmd run build` passes.

## In progress
- Compact in-run opponent status cards (live HUD chips, not just standings while terminal). Deferred post-ship.

## Known issues
- **Color drift on disconnect — FIXED 2026-05-02:** GameScene now caches initial roster→color map at match start.
- **MENU freeze on scene reuse — FIXED 2026-05-02:** Moved `updateModeTabStyles` call past `primaryActionText` creation in MenuScene.
- **4p broadcast laser miss (2026-05-02 smoke):** D fired broadcast laser from terminal scoreboard, A + B received in D's color, C's window did not show the strike. Receiver code path clean. Likely Supabase realtime delivery drop under multi-window load on single test machine, or browser background-tab throttling on C. No code fix without runtime repro confirming. Deferred — retest with windows on separate machines or with C foregrounded before treating as code bug.
- Multi-pilot final result REMATCH button is a fresh add — needs a multi-window smoke run to verify ready aggregation, cancel propagation, fire-on-all-ready, and disconnect mid-wait behavior.
- Multi-pilot spectate (after local terminal, before all-terminal) still shows the standings table with the primary peer's spectate mirror behind a heavy dim — readable but not redesigned.
- MissionSelect still contains old Versus briefing code, but the active Versus route no longer enters it.
- Repulsors stay effectively 1v1-only; 3-4 player terminal uses laser + enemy. Post-ship: swap repulsor for broadcast laser+enemy in 1v1 for parity.
- Old `VersusLobbyScene` still exists in scene list but is no longer entered from the main menu.
- Main menu embedded Versus room UI needs a live compact-mobile visual check.
- Pocket mode is intentionally disabled in versus.
- Versus-mode mirror does not render bosses.
- Latent class of bugs: other `!:` fields in MenuScene may still hold stale cross-scene-reuse references. Single fix patches the only call site that hit it tonight; broader shutdown null-out is post-ship cleanup.
- Manual Supabase SQL migration for `mode` / `company_id` columns still pending (`docs/sql/2026-04-28 1403 mode and company_id columns.sql`).

## Next actions
1. Smoke-test multi-pilot REMATCH: 3p + 4p, ready/cancel/fire, with a mid-wait disconnect.
2. Re-attempt the 4p broadcast laser miss with C foregrounded and on a separate machine.
3. Resume ship-hardening smoke matrix: death attribution coverage, mobile pass, solo regression sweep.

## Active plan
docs/plans/2026-05-01 2127 Plan - Ship Hardening.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run dev -- --host 0.0.0.0`
3. 1v1: existing death/spectate/laser/repulsor/rematch flow still works.
4. 3-4 player live: each pilot sees the others as colored ghost ships overlaid on their own arena while playing.
5. 3-4 player terminal: each pilot's death/extract still shows live standings with broadcast laser/enemy controls; spectate-fired laser no longer self-paints on the mirror.
6. 3-4 player resolution: once every pilot has extracted or died, the screen switches to a `FINAL STANDINGS` ranked table with REMATCH + MENU side by side.
7. 3-4 player rematch: each pilot's REMATCH cycles label between `REMATCH`, `WAITING (X/N) — CANCEL`, and `STARTING…`. Match restarts when local + all present peers are ready.
8. 3-4 player disconnect: leaver is shown as DESTROYED with their last known score and their original color (no drift onto remaining pilots).

## Recent logs
- docs/log/2026-05-02 2220 Multi-Pilot Rematch and Smoke Hardening.md - added multi-pilot rematch UI/state, fixed MenuScene scene-reuse crash, fixed friendly-fire echo, fixed color drift on disconnect, fixed lobby roster crowding.
- docs/log/2026-05-01 2118 Lobby Stack and Killer Attribution.md - stacked lobby roster vertically and added multiplayer death attribution end-to-end.
- docs/log/2026-05-01 2100 Multi Pilot Win State and Ghost Ships.md - added all-pilot terminal resolve, multi-pilot final ranked result UI, and color-coded ghost ships for every peer.
- docs/log/2026-05-01 2052 Multi Pilot Broadcast Sabotage.md - added player colors, colored broadcast lasers, colored broadcast enemy spawns, and 3-4 player terminal scoreboard controls.
- docs/log/2026-05-01 2042 Four Player Death Screen Direction.md - captured scoreboard-first 3-4 player death screen and preserved 1v1 spectate direction.
