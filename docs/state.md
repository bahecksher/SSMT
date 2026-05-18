# State
_Last updated: 2026-05-18 1259_

## Current focus
Rival-system implementation supersedes the previous ship-hardening active plan for now. The first slice is an Ironveil laser rival prototype to make solo runs feel more alive before the story overhaul.

## What's working
- `npm.cmd run build` passes.
- Post-boss phase-10 escape now resolves cleanly: once the forced extraction gate expires, the collapse boundary continues shrinking to zero radius, so the player can no longer remain stranded alive after the window closes.
- Wormhole pockets no longer auto-eject on timeout. The boundary now collapses to zero, and a final center gate opens during the last 8 seconds as the deliberate escape route.
- `npm.cmd run test:e2e` passes: 11 Playwright tests across desktop Chromium/Firefox/WebKit plus mobile Chrome.
- `?test=1` exposes a small `window.__BITP_TEST__` harness for scene state and stable smoke actions without changing normal gameplay behavior.
- Desktop boot smoke verifies visible canvas and page-error collection.
- Solo smoke reaches Mission Select, deploys into `GameScene`, verifies the canvas remains visible, and toggles pause/resume during countdown.
- Callsign edit persistence is automated through the test harness and localStorage.
- Versus smoke uses isolated Chromium browser contexts/localStorage to create a room, join, ready both players, wait for countdown, and verify both deploy into `GameScene`.
- Mobile smoke uses Pixel 5 emulation, verifies the canvas on menu and Versus lobby, and writes screenshots to `test-results/mobile-menu.png` and `test-results/mobile-versus-lobby.png`.
- Existing Versus hardening work from prior sessions remains the current gameplay baseline.
- `npm.cmd run build` passes after the rival prototype.
- Solo modes now enable a phase-2-through-phase-10 rival prototype: Veyra Kade / Redline, an Ironveil ship that hunts the player, telegraphs/fires a forward laser, takes shield-ram HP damage, and flees instead of dying at 1 HP.
- Rival spawning now rolls by chance every 18 seconds while eligible, with a 35% chance per roll.
- Debug rival spawn is available during solo gameplay with `Shift+R` or `window.bitpSpawnRival()`.
- Redline's laser now tracks briefly, commits to a slightly imperfect line, and fires for a shorter window so it is dodgeable instead of a perfect lock.
- Redline's laser now extends across the screen like regular laser hazards.
- During the lethal window, Redline's straight beam now sweeps slowly toward the player at a capped arc speed.
- Rivals are larger and slower, with a visible laser hardpoint and hovering badge/icon.
- A shield hit during a rival's 1 HP flee now destroys the rival, creating a chase-and-finish window.
- Rival flee now rolls after Redline reaches 1 HP: 75% chance to flee, 25% chance to stay active at 1 HP and vulnerable to a follow-up hit.
- Redline's lethal laser window is longer, while rival hunt/flee movement is slower.
- Redline's beam endpoint now derives from the current layout diagonal so rotating beams extend past the screen on larger/wider displays.
- Redline's hull silhouette now reads more like a swept-wing fighter with a cockpit, notched tail, and clearer nose laser barrel.
- Redline now shows damage as HP drops: debris bursts on shield hits, hull cracks, a missing wing at 1 HP, and smoke from the damaged side.
- Enemy ships can now target active, non-fleeing rivals and damage them on collision.
- Redline now kites/orbits the player while waiting for laser shots instead of directly ramming like a standard enemy.
- Removed Redline's redundant floating plus/charge badge; the traced laser line now carries charge readability.
- Redline is clamped inside the arena while fighting so she cannot kite outside the reachable field; flee still exits intentionally.
- Redline's hull now turns toward laser aim instead of snapping instantly during charge/fire.
- Versus explicitly keeps rivals disabled for this first slice.

## In progress
- Rival-system implementation is intentionally narrow: only the Ironveil laser rival exists so far.
- Rival-system design questions remain open: reward/persistence scope, heat trigger, and how black-hole bombs should be destroyed.
- Ship-hardening smoke matrix is still incomplete, especially deeper gameplay/result cases.
- Compact in-run opponent status cards remain deferred post-ship.

## Known issues
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
1. Playtest Redline in solo phases 2-10 for spawn timing/chance, laser readability, dodgeability, HP/flee kill window, and comm interruption cadence.
2. Add the next rival variant, likely the Ironveil repulse bruiser or layered-shield rival.
3. Decide reward/rematch persistence and whether rival heat should key off company rep, accepted contract company, or run phase.

## Active plan
docs/plans/2026-05-18 1213 Plan - Rival System.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run test:e2e`
3. `npm.cmd run dev -- --host 0.0.0.0`
4. Manually verify solo rival spawn chance from phase 2 through phase 10, `Shift+R` debug spawn, Redline laser tell/fire collision, shield-ram HP interactions, flee-at-1-HP behavior, comm timing, Versus exclusion, pocket exclusion, and no fresh post-boss escape spawns.

## Recent logs
- docs/log/2026-05-18 1258 Redline Smooth Aim Turn.md - changed Redline's hull to rotate toward laser aim instead of snapping to face the player.
- docs/log/2026-05-18 1257 Rival Arena Containment.md - kept Redline inside the arena during fight states while preserving intentional flee exits.
- docs/log/2026-05-18 1256 Removed Redline Charge Badge.md - removed the redundant floating plus/badge from Redline's ship.
- docs/log/2026-05-18 1255 Redline Kiting AI.md - changed Redline's hunt behavior to keep distance/orbit and only turn into laser shots when ready.
- docs/log/2026-05-18 1253 Enemies Attack Rivals.md - enemies now target and damage active rivals when they are the closer secondary target.
- docs/log/2026-05-18 1252 Rival Damage Feedback.md - added rival damage debris, hull cracks, missing wing, and smoke feedback.
- docs/log/2026-05-18 1249 Rival One HP Flee Roll.md - corrected the 75% flee roll so Redline reaches 1 HP before deciding whether to run.
- docs/log/2026-05-18 1248 Redline Ship Silhouette.md - reworked Redline's visual silhouette to read more like a distinct fighter ship.
- docs/log/2026-05-18 1246 Rival Beam Layout Span.md - made Redline's beam span layout-derived so it extends past screen edges at every rotation.
- docs/log/2026-05-18 1244 Rival Flee Chance and Beam Window.md - slowed Redline, lengthened the lethal laser window, and made low-HP flee a 75% chance.
- docs/log/2026-05-18 1241 Rival Readability and Kill Window.md - made rivals larger/slower, added hardpoint/badge visuals, and allowed a fleeing 1 HP rival to be destroyed by a follow-up shield hit.
- docs/log/2026-05-18 1239 Redline Laser Sweep.md - made Redline's full-screen beam slowly arc toward the player while firing.
- docs/log/2026-05-18 1236 Redline Full Beam Range.md - extended Redline's committed beam range across the screen.
- docs/log/2026-05-18 1235 Redline Laser Variance.md - made Redline's laser commit after a brief tracking window with aim variance and a shorter lethal duration.
- docs/log/2026-05-18 1230 Rival Debug Shortcut.md - added `Shift+R` / `window.bitpSpawnRival()` for manual rival testing.
- docs/log/2026-05-18 1228 Rival Spawn Chance.md - changed rival eligibility to phase 2 through phase 10 with chance-based spawn rolls.
- docs/log/2026-05-18 1225 Rival Laser Prototype.md - added the first Ironveil laser rival prototype and verified the build.
- docs/log/2026-05-18 1213 Rival System Planning.md - created the rival-system plan and documented the intentional pause from ship-hardening implementation.
- docs/log/2026-05-12 1721 Wormhole Center Escape Gate.md - replaced timeout ejection with a terminal collapse plus center escape gate and verified the build.
- docs/log/2026-05-12 1717 Post-Boss Escape Collapse.md - made the post-boss collapse terminal after the extraction window and verified the build.
- docs/log/2026-05-08 1327 Playwright Plan Revision.md - added a plan revision for the Playwright ship smoke automation and pointed state at it.
- docs/log/2026-05-08 1324 Playwright Smoke Matrix Expansion.md - added focused Playwright smoke coverage for boot, solo, callsign, Versus lobby deploy, and mobile screenshots.
- docs/log/2026-05-08 1312 Playwright Test Setup.md - installed Playwright, added config/scripts/boot smoke test, downloaded browsers, and verified build + e2e smoke.
- docs/log/2026-05-02 2220 Multi-Pilot Rematch and Smoke Hardening.md - added multi-pilot rematch UI/state, fixed MenuScene scene-reuse crash, fixed friendly-fire echo, fixed color drift on disconnect, fixed lobby roster crowding.
- docs/log/2026-05-01 2118 Lobby Stack and Killer Attribution.md - stacked lobby roster vertically and added multiplayer death attribution end-to-end.
