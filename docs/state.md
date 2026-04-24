# State
_Last updated: 2026-04-24 1140_

## Current focus
Closed a targeted gameplay cleanup pass outside the active desktop-packaging plan: the phase-4 layered music section now carries through phase 6, result screens hard-reset the music clock for cleaner back-to-back runs, pickups are visually unified to green, ship-kill payouts are much fatter, tiny asteroid point drops are gone, and gate previews now show earlier with a clearer center marker. Windows standalone packaging is still the open distribution thread.

## What's working
- Layered music still boots sample-aligned, but the `drumsThree` / `bassThree` / `gameSynth` arrangement now stays live through phases 4-6. `fullPhase2` no longer takes over until phase 7.
- Entering `DESTROYED` or `EXTRACTED` now restarts the layered music clock before the result mix comes up, so the next run does not inherit a drifted loop position.
- Regular beam hazards now play a higher-pitched placeholder charge cue on warning spawn plus a lower, heavier placeholder fire hit on warning-to-lethal transition.
- Shield, bonus-credit, and bomb pickups all render on the same green lane, and their board-wipe debris now matches that lane too.
- Small asteroid break bonuses are disabled (`ASTEROID_DESTROY_DROP_CHANCE = 0`).
- Ship-destruction bonus pickups are significantly higher (`ENEMY_BONUS_POINTS = 360`, `NPC_BONUS_POINTS = 210`).
- Extraction gates preview 15s before opening instead of 10s, and the preview now keeps a brighter center marker/brackets visible the whole time.
- `npm.cmd run build` passes.

## In progress
- Browser smoke test of the new music-reset flow, beam placeholder feel, ship payout tuning, and earlier gate preview readability.
- User-side Rust toolchain install (https://rustup.rs) before the first `npm run tauri:build`.
- First end-to-end packaged-app smoke test (Phaser WebGL + Supabase in WebView2).

## Known issues
- Beam audio is still placeholder-based: both `beamCharge` and `beamFire` currently reuse `audio/bomb.mp3` with pitch/rate changes.
- The new result-screen music reset was build-verified but not live playtested this session.
- `PHASE_LENGTH = 30s` vs. the actual rendered loop lengths is still unmeasured.
- Retry/continue after extraction still bypasses MissionSelect for a direct next run.
- Placeholder Tauri icons derived from the small company-logo GIF still need a clean 1024x1024 source.
- `tauri.conf.json` CSP is still `null` pending the first packaged smoke test.
- Supabase `scores` / `losses` still need nullable `company_id` columns server-side for corporation-tagged rows to populate fully.
- Browser autoplay restrictions still require initial player interaction before music/SFX can become audible.

## Next actions
1. Browser-playtest the cleanup pass: survive into phases 4-7, die/extract, retry immediately, and confirm the music always comes back in locked.
2. Decide whether the phase-10 boss beam cycle also needs the new placeholder charge/fire treatment.
3. Source dedicated `beam-charge` / `beam-fire` assets so the placeholder bomb-derived tuning can be replaced.
4. Install Rust from https://rustup.rs and resume the Tauri packaging path.
5. Run `npm run tauri:build`, launch the packaged app, and repeat the browser smoke test there.

## Active plan
docs/plans/2026-04-16 1610 Plan - Desktop Standalone.md

## How to verify
1. `npm.cmd run build`
2. Start a run and survive into phase 4: the layered phase-4 mix should arrive on the beat.
3. Stay alive through phases 5 and 6: the layered mix should continue; `fullPhase2` should not take over until phase 7.
4. Die or extract, then immediately retry: the next run's bass/countdown sync should restart cleanly instead of drifting.
5. Watch regular beams in phase 5+: you should hear a quick charge whine on spawn and a heavier, lower fire hit when they go lethal.
6. Break small asteroids repeatedly: they should no longer drop the tiny mining-point pickups.
7. Kill ships: the floating point pickup values should be noticeably larger than before.
8. Watch an extraction gate spawn: its center marker should be readable earlier, and the full preview should begin 15s before the open window.

## Recent logs
- docs/log/2026-04-24 1140 Gameplay Cleanup Pass.md — extended the layered music window, reset result-screen music timing, retuned beam placeholder audio, increased ship payouts, and strengthened gate previews
- docs/log/2026-04-23 1643 Music Sync Followup.md — moved all layered tracks to `BOOT_TRACKS` for 3→4 sync and locked phase 5+ to `fullPhase2`
- docs/log/2026-04-22 2333 Bug Fix Pass.md — fixed phase-4 music cutout, MissionSelect brief clamp, hidden debug phase shortcut, and placeholder beam SFX
