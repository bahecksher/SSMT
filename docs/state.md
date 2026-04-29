# State
_Last updated: 2026-04-29 1915_

## Current focus
The strongest suspected iPhone 13 mini regression path has now been cut more directly: on constrained narrow/short viewports, live versus no longer repaints the peer's full enemy ghost field behind gameplay. The lighter shared render profile is still in place, but the bigger change is that constrained live play now keeps only the peer ship/status while full-detail peer rendering remains available in spectate.

## What's working
- `src/game/data/renderTuning.ts`: central constrained-vs-default render profile now covers shared visual density plus live-mirror behavior (`mirrorLiveBgAlpha`, `mirrorLiveRenderEnemies`, live/spectate mirror cadence).
- `src/game/scenes/GameScene.ts`: constrained live versus now skips peer enemy ghost rendering, skips live mirror tint fill, redraws live mirror at snapshot cadence, and still restores richer peer presentation in spectate.
- `src/game/entities/GeoSphere.ts`: shared globe still lowers mesh/ring detail and redraw cadence automatically on constrained phone-sized viewports.
- `src/game/entities/DrifterHazard.ts` and `src/game/entities/SalvageDebris.ts`: repeated dashed-ring effects still use lighter segment counts on constrained phones.
- Existing versus flow remains intact: MissionSelect briefing lock-in, extract-required win, sabotage lane sweeps, fullscreen spectate, spectator regen at 7s, stale-epoch rematch protection.
- `npm.cmd run build`: passes.

## In progress
- Live iPhone 13 mini playcheck of normal gameplay and live versus after the direct mirror-cost cut.
- Manual two-window versus pass after the recent spectate / sabotage / briefing / backdrop / mirror-framerate changes.
- Readability check on the new constrained live mirror, since it now favors framerate over full ghost detail.

## Known issues
- This direct versus-mirror framerate fix is still build-verified only; no fresh live phone verification yet on iPhone 13 mini.
- Current versus flow is still missing a fresh two-window manual playtest after the spectate disruption, lobby backdrop, receiver-side strike-clear, spectate regen/telegraph tuning, briefing auto-unlock, palette lockout, and now the mobile mirror simplification.
- Spectate lane buttons still sit on arena edges and may crowd ships or hazards during live play.
- Manual Supabase SQL migration for `mode` / `company_id` columns is still pending (`docs/sql/2026-04-28 1403 mode and company_id columns.sql`).
- Restored arcade/campaign company buffs are still not manually verified or balance-tested.
- Soft respawn keeps rep-flux income accumulators across lives.
- Rep-flux tuning placeholders remain in `tuning.ts`.

## Next actions
1. Run the latest build on iPhone 13 mini and check whether live versus is now smooth enough during active play.
2. Run a two-window versus session on a phone-sized viewport and confirm the ship/status-only live mirror still feels useful while spectate remains readable.
3. If the phone still chugs, decide whether the next cut is gameplay-only geo-sphere reduction, lighter menu/briefing background simulation, or removing more live mirror work on constrained screens.

## Active plan
docs/plans/2026-04-29 1915 Plan revision - Mobile Framerate Prioritization.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run dev`, open on an iPhone 13 mini-sized viewport, enter versus, and play active live gameplay long enough to stress asteroids, enemies, beams, and the live peer mirror.
3. During live play on the constrained viewport, confirm the peer status and ship still render, but the full peer enemy ghost field is no longer present behind gameplay.
4. End a run and enter spectate; confirm the richer peer mirror still appears there with the expected larger presentation.
5. Open two browser windows for versus and confirm the rest of the existing flow still works: lobby -> MissionSelect lock-in -> deploy -> sabotage -> spectate -> result -> rematch.

## Recent logs
- docs/log/2026-04-29 1915 Versus Mirror Live-Play Cost Cut.md - cut the most suspicious versus-specific render path by simplifying constrained live mirror rendering.
- docs/log/2026-04-29 1909 Mobile Framerate Prioritization.md - added constrained-viewport render tuning to cut recurring vector redraw cost on phone-sized screens.
- docs/log/2026-04-29 1810 Session Wrap and Spectator Regen Clarification.md - aligned the spectator regen comment/docs with the actual 7-second behavior and prepared the session for push.
- docs/log/2026-04-29 1656 Spectator Laser Regen to 7s.md - retuned spectator laser charge regen from 5s to 7s to slow versus disruption cadence.
