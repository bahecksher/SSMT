# 2026-04-16 1610 Plan - Desktop Standalone

## Goal
Ship the game as a standalone Windows desktop app (via Tauri) for distribution on itch.io, so players don't need to visit the GitHub Pages build. Globally-played runs still submit to Supabase when online; offline play still updates the local `BEST` score but does not submit global runs.

## Non-goals
- Mac/Linux installers (Windows-only for now)
- Mobile app store (Google/iOS) — future consideration, noted as a reason to prefer Tauri 2 over Electron
- Code signing / auto-update (would require cert purchase; defer until player demand proves distribution model)

## Scope decisions
- Offline UX: `navigator.onLine` short-circuits leaderboard network calls and shows `OFFLINE — GLOBAL BOARDS UNAVAILABLE` in the menu leaderboard panel.
- Local `BEST` continues to update via existing `SaveSystem.saveBestScore` regardless of network state.
- Remove the DEBUG PHASE section from the pause menu. The underlying `debugJumpToPhase` method and `scoreRecordingBlocked` state stay in place (dead code path, no UI entry); removing them is out of scope for this change.
- Keep Supabase anon key in source — it is a public key by design, exposure is identical to the current web build.

## Steps
1. Remove the DEBUG PHASE divider, title, phase chip buttons, and debug status text from `GameScene.ts` pause menu layout (~lines 2447-2493). Adjust the mission section's Y-offset calculation so it picks up where the volume sliders end.
2. Update `LeaderboardService.ts`:
   - Guard `fetchLeaderboard`, `fetchCorporationLeaderboard`, `fetchBiggestLoss`, `submitScore`, `submitLoss` on `navigator.onLine`.
   - Return `[]` / `null` for fetchers when offline; no-op for submitters.
   - Export an `isOnline()` helper so UI can display an offline banner without duplicating the check.
3. Update `MenuScene.ts` leaderboard render to show `OFFLINE — GLOBAL BOARDS UNAVAILABLE` when `isOnline()` is false (reuse existing empty-state text path).
4. Change `vite.config.ts` build base from `/SSMT/` to `./` for the desktop build. The GitHub Pages path can be reintroduced later via a `VITE_PAGES_BUILD` env var if we still want to publish there.
5. Add Tauri:
   - `npm install --save-dev @tauri-apps/cli`
   - Scaffold `src-tauri/` (manual config so we don't need interactive `tauri init`)
   - `tauri.conf.json`: window size matches Phaser canvas (1280x720 default, resizable), title `Slick's Salvage & Mining Operation Training Module`, allowlist `https://djpliigclofvtfbzhkge.supabase.co` in CSP + HTTP scope.
   - `Cargo.toml` minimal, `main.rs` default Tauri window.
   - Icons placeholder (will need real `.ico` later — note in Known Issues).
   - Add npm scripts: `tauri:dev`, `tauri:build`.
6. Attempt `npm run build && npx tauri build` once user installs Rust via https://rustup.rs. If Rust not present, document the install step and stop there — config is ready.

## How to verify
- `npm.cmd run build` succeeds with new `./` base.
- Dev server still serves at `/` (base only switches for build).
- Pause menu no longer shows DEBUG PHASE section or phase chips.
- With devtools Network throttled to offline, the menu leaderboard shows the offline banner and no requests fire.
- With network on, leaderboard populates as before.
- After Rust install: `npx tauri build` produces an `.msi` installer in `src-tauri/target/release/bundle/msi/`.

## Risks / open questions
- WebView2 rendering parity for Phaser's WebGL — expect this to work, but needs a smoke test on the packaged build.
- `navigator.onLine` is an optimistic signal — returns true if *any* network interface is up, not if Supabase is actually reachable. Acceptable trade-off; failures still fall through to the existing `console.warn` path.
- Placeholder icons — itch listings will want a proper icon set. Tracked in Known Issues.
