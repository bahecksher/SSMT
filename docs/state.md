# State
_Last updated: 2026-05-19 0215_

## Current focus
Targeted gameplay bug/tuning pass for rival encounter limits, post-boss escape placement, wormhole pocket pressure, wormhole mood, and phase-based background ring approach.

## What's working
- `npm.cmd run build` passes.
- Rivals now latch after their first spawn so the run cannot spawn another rival after the first one flees, dies, escapes, or gets cleared by a wormhole transition.
- The post-boss forced escape gate now appears at the arena center instead of using normal random gate placement.
- Wormhole pocket asteroid pressure is reduced through lower drifter caps, slower spawn pacing, and lower pocket speed multipliers across full, compact, and tiny viewports.
- Wormhole pocket palette is darker and more otherworldly while preserving bright player/gate/salvage readability.
- The background planet/ring now scales upward by phase, including normal gate phase advances, debug phase jumps, and wormhole return phase jumps.

## In progress
- Rival-system implementation remains intentionally narrow: only the Ironveil laser rival exists so far.
- Rival-system design questions remain open: reward/persistence scope, heat trigger, and how black-hole bombs should be destroyed.
- Ship-hardening smoke matrix is still incomplete, especially deeper gameplay/result cases.

## Known issues
- Live audio feel still needs manual browser/phone verification; headless smoke confirms state/cache but cannot judge audibility or mix.
- Wormhole pocket asteroid feel and darker palette need a real playtest pass; build verifies wiring, not final feel.
- Phase-based ring scaling has not been visually playtested yet; it may need a stronger or softer scale curve after seeing phases 1-10 in motion.
- 4p broadcast laser miss from the prior smoke run still needs retest with C foregrounded / separate machine before treating as a code bug.
- Multi-pilot rematch still needs a multi-window smoke run for ready aggregation, cancel propagation, all-ready launch, and disconnect mid-wait.
- Multi-pilot spectate after local terminal is readable but not redesigned.
- MissionSelect still contains old Versus briefing code, though active Versus route no longer enters it.
- Repulsors remain effectively 1v1-only; 3-4 player terminal uses laser + enemy.
- Old `VersusLobbyScene` still exists in scene list but is no longer entered from the main menu.
- Main menu embedded Versus room UI needs manual compact-mobile visual review beyond screenshots.
- Pocket mode is intentionally disabled in Versus.
- Versus-mode mirror does not render bosses.
- Broader MenuScene scene-reuse `!:` cleanup is still post-ship cleanup.
- Manual Supabase SQL migration is still pending: `docs/sql/2026-04-28 1403 mode and company_id columns.sql`.
- Playwright Versus automation depends on live Supabase realtime and is intentionally Chromium-only to reduce external-service flake.
- Firefox can report a benign Cloudflare/Supabase `__cf_bm` websocket cookie warning as a console error; the Playwright error collector filters only that known warning.
- Jumping directly into active gameplay via debug phase shortcuts can expose an existing missing cached audio asset path in WebKit; the automated solo smoke avoids that shortcut.
- `npm install` previously reported 2 vulnerabilities; no audit/fix was performed in the Playwright setup pass.

## Next actions
1. Manually play a solo run through a rival spawn and confirm no second rival appears later in the same run.
2. Debug-jump or playtest the phase-10 boss defeat and confirm the final escape gate appears centered and readable.
3. Playtest a wormhole pocket on desktop and phone-sized viewport to tune asteroid pressure, palette darkness, and phase ring scale curve.

## Active plan
docs/plans/2026-05-18 1213 Plan - Rival System.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run dev -- --host 0.0.0.0`
3. Manual checks: rival one-spawn-per-run, post-boss center gate, wormhole pocket density, darker pocket realm, and ring growth from phase 1 to 10.

## Recent logs
- docs/log/2026-05-19 0215 Gameplay Bug Tuning.md - fixed one-rival-per-run, centered post-boss escape, eased/darkened wormholes, and added phase ring scaling.
- docs/log/2026-05-18 1727 Music Trigger Debug.md - restored phase-5 random full-track music handoff and verified build/runtime smoke.
- docs/log/2026-05-18 1258 Redline Smooth Aim Turn.md - changed Redline's hull to rotate toward laser aim instead of snapping to face the player.
- docs/log/2026-05-18 1257 Rival Arena Containment.md - kept Redline inside the arena during fight states while preserving intentional flee exits.
- docs/log/2026-05-18 1256 Removed Redline Charge Badge.md - removed the redundant floating plus/badge from Redline's ship.
