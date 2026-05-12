# State
_Last updated: 2026-05-12 1721_

## Current focus
Ship-hardening remains the active direction. The active plan now has a Playwright smoke revision documenting automated coverage and what remains manual.

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

## In progress
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
1. Continue the active ship-hardening manual matrix: 4p broadcast/terminal/final/disconnect, death attribution coverage, mobile touch controls, and solo mission/boss/result sweeps.
2. Manually review `test-results/mobile-menu.png` and `test-results/mobile-versus-lobby.png` after e2e runs for compact layout readability.
3. Consider a later local/mock realtime harness only if live Supabase flake becomes a recurring blocker.

## Active plan
docs/plans/2026-05-08 1327 Plan revision - Playwright Ship Smoke.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run test:e2e`
3. `npm.cmd run dev -- --host 0.0.0.0`
4. Continue the active ship-hardening manual matrix from `docs/plans/2026-05-01 2127 Plan - Ship Hardening.md`.

## Recent logs
- docs/log/2026-05-12 1721 Wormhole Center Escape Gate.md - replaced timeout ejection with a terminal collapse plus center escape gate and verified the build.
- docs/log/2026-05-12 1717 Post-Boss Escape Collapse.md - made the post-boss collapse terminal after the extraction window and verified the build.
- docs/log/2026-05-08 1327 Playwright Plan Revision.md - added a plan revision for the Playwright ship smoke automation and pointed state at it.
- docs/log/2026-05-08 1324 Playwright Smoke Matrix Expansion.md - added focused Playwright smoke coverage for boot, solo, callsign, Versus lobby deploy, and mobile screenshots.
- docs/log/2026-05-08 1312 Playwright Test Setup.md - installed Playwright, added config/scripts/boot smoke test, downloaded browsers, and verified build + e2e smoke.
- docs/log/2026-05-02 2220 Multi-Pilot Rematch and Smoke Hardening.md - added multi-pilot rematch UI/state, fixed MenuScene scene-reuse crash, fixed friendly-fire echo, fixed color drift on disconnect, fixed lobby roster crowding.
- docs/log/2026-05-01 2118 Lobby Stack and Killer Attribution.md - stacked lobby roster vertically and added multiplayer death attribution end-to-end.
