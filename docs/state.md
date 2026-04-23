# State
_Last updated: 2026-04-23 1643_

## Current focus
Closed out the bug-fix pass with the music sync work nailed down: every layered track now boots in the same `startMusic` iteration so the phase 3→4 swap is sample-aligned, and `fullPhase2` is the locked-in phase 5+ track. Tauri Windows packaging remains the open distribution thread, still blocked on a local Rust toolchain install.

## What's working
- All six layered tracks (`menuSynth`, `bassOne`, `drumsTwo`, `drumsThree`, `bassThree`, `gameSynth`) load at boot via the expanded `BOOT_TRACKS` set in `MusicSystem.ts`. They all `.play()` in the same `startMusic` for-loop iteration with the shared `MUSIC_START_DELAY_S = 0.05`, so the phase 3→4 crossfade from bass-1/drums-2/gameSynth into drums-3/bass-3 stays beat-aligned. ~1-2MB extra at boot in exchange for guaranteed sync.
- Late-load safety net: `ensureLayeredSounds` still kicks any newly-discovered track at vol 0 if `layeredStarted` is true. With all tracks now in `BOOT_TRACKS` this path shouldn't fire in practice, but it prevents the original phase-4 silent-cutout regression if a track ever moves out of `BOOT_TRACKS` again.
- Phase 5+ always plays `fullPhase2`. `selectedLateGameTrack` defaults to `fullPhase2` instead of randomly picking between fullPhase1/fullPhase2.
- MissionSelect mix has `bassOne: 1` so bass kicks in on the briefing room — sync holds because bass-1 has been running silently since boot.
- MissionSelect brief text clamps to whatever vertical space remains under the (possibly multi-line) label, ellipsizing the last kept line via `getWrappedText()`.
- Hidden debug phase jump: `Shift+1..9` (and `Shift+0` for phase 10) plus `window.bitpJumpToPhase(n)` reset extraction/difficulty/regent state and warp the live run. Sets `scoreRecordingBlocked = true` so jumped runs do not submit to the leaderboard. No on-screen UI.
- Placeholder `beamFire` SFX added to `SfxSystem`. `BeamHazard` plays it on the warning→lethal transition (`bomb.mp3` pitched up; comment in source flags the swap).
- Tauri 2 scaffold from the previous pass still in place (`src-tauri/`, `tauri:build` script, relative-path Vite build, offline-aware leaderboard, DEBUG PHASE pause UI removed).

## In progress
- User-side Rust toolchain install (https://rustup.rs) — required before `npm run tauri:build`.
- First end-to-end packaged-app smoke test (Phaser WebGL + Supabase in WebView2).
- Sourcing a real beam-fire audio asset to replace the pitched-bomb placeholder.

## Known issues
- `PHASE_LENGTH = 30s` and the layered-track loop lengths have not been measured. User asked whether phases need to shorten to match the music; punted on this pass — would need to measure bass-1 loop duration and decide whether phases should be a multiple of it.
- `beamFire` is a placeholder using `audio/bomb.mp3` with `rate: 1.6` + `detune: 600`. Swap once a dedicated beam-fire sample is sourced.
- Comment in `ensureLayeredSounds` still warns about "NOT beat-aligned" late-loaded tracks; that scenario can no longer occur with the expanded `BOOT_TRACKS`, but the guard remains as a safety net. Comment could be tightened on a future pass.
- Hidden debug phase shortcut has no on-screen affordance — intentional, but undocumented for any future contributor.
- Placeholder Tauri icons derived from the small company-logo GIF; want a crisp 1024×1024 source before public itch release.
- `tauri.conf.json` CSP is `null` while we confirm Supabase + WebGL parity in the desktop webview; tighten to an allowlist after first smoke test.
- No code signing for the Windows installer — SmartScreen will flag "Unknown Publisher" on first run.
- Mac/Linux/iOS/Android builds intentionally out of scope this pass.
- Dormant campaign-specific code and save fields still exist even though campaign is no longer player-accessible.
- Supabase `scores`/`losses` still need nullable `company_id` columns server-side for corporation-tagged boards and loss rows to populate fully.
- Local `BEST` score still shared across the historical campaign/arcade save model even though only arcade is accessible.
- Background simulation duplicated between MenuScene and MissionSelectScene.
- Settings UI duplicated across MenuScene, MissionSelectScene, GameScene pause menu.
- Browser autoplay restrictions still require initial player interaction before audio can become audible.
- Retry/continue after extraction still bypasses MissionSelect for a direct next run.
- Beam hazards still span full screen width/height, not clipped to arena.
- Boss encounter balance not tuned for all screen sizes or long post-kill survival windows.
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly.

## Next actions
1. Smoke-test in browser end-to-end: menu music kicks on, MissionSelect adds bass-1 in beat, phase 3→4 crossfade is on the beat, phase 5 swaps in `fullPhase2`, MissionSelect brief ellipsizes when tight, `Shift+5` jumps phases, beams play the placeholder zap on fire.
2. Measure bass-1 / drums-2 / drums-3 loop durations and decide whether to retune `PHASE_LENGTH` (currently 30s) for tighter beat-to-gate alignment.
3. Drop in a real beam-fire sample at `public/audio/beam-fire.mp3` and update `SFX_PATHS.beamFire`.
4. Install Rust from https://rustup.rs on this machine.
5. Run `npm run tauri:build`; confirm `.msi`/`.exe` lands in `src-tauri/target/release/bundle/`.
6. Launch the installed app, verify game loads, audio plays after first click, leaderboard populates online and shows offline banner when disconnected, BEST score persists across relaunches.
7. Replace placeholder icon with a crisp 1024×1024 PNG source and regenerate via `npx tauri icon`.
8. Tighten `tauri.conf.json` CSP once smoke test passes.
9. Upload installer to itch.io under the Windows download slot.

## Active plan
docs/plans/2026-04-16 1610 Plan - Desktop Standalone.md

## How to verify
1. `npm.cmd run build` passes with relative asset paths in `dist/index.html`.
2. Open the menu — `menuSynth` should be audible immediately after first input unlocks audio.
3. Enter MissionSelect — `bassOne` should layer in on the beat, no drift.
4. Load a run, survive into phase 4 — drums-3 / bass-3 should crossfade in audibly and on the beat (no silent drop, no off-beat artifacts).
5. Survive into phase 5 — `fullPhase2` should fade in (not `fullPhase1`).
6. Shrink window vertically on MissionSelect until cards get tight; long briefs should ellipsize, not overlap the label.
7. In a run, press `Shift+5` — board clears, phase jumps to 5, beams should start spawning.
8. In phase 5+, each beam's warning→fire transition should make a pitched-up zap.
9. Toggle devtools Network to offline, reload, open the menu leaderboard, confirm `OFFLINE — GLOBAL BOARDS UNAVAILABLE` banner; toggle back online and confirm leaderboards repopulate.
10. After installing Rust: `npm run tauri:build` produces an installer; run the installer, launch the app, repeat steps 2-9 in the packaged webview.

## Recent logs
- docs/log/2026-04-23 1643 Music Sync Followup.md — moved all layered tracks to BOOT_TRACKS for 3→4 sync; locked phase 5+ to fullPhase2; commit + push
- docs/log/2026-04-22 2333 Bug Fix Pass.md — phase-4 music cutout, bass sync reset, MissionSelect brief clamp, hidden debug phase shortcut, placeholder beam SFX
- docs/log/2026-04-16 1610 Desktop Standalone Scaffolding.md — added Tauri 2 config, offline-aware leaderboard, removed debug pause menu
- docs/log/2026-04-14 0107 Company Rep Clarity.md — clarified how company rep is earned and when it is claimed
- docs/log/2026-04-14 0101 MissionSelect Reputation Visibility.md — restored mission rep payout display and company standing visibility on MissionSelect
- docs/log/2026-04-14 0056 Rep-Gated Corporation Selector.md — restricted the corporation selector to rep-unlocked corporations while keeping `FREE AGENT`
- docs/log/2026-04-14 0054 Manual Corporation Selector.md — replaced the read-only affiliation text with a persisted corporation selector button
