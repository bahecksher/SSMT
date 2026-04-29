# Plan - PC and Google Play Ship
_Created: 2026-04-28 1403_

## Goal
Ship the game as:
1. A signed Windows desktop installer (continuation of existing Tauri 2 desktop scaffold) suitable for itch.io and direct distribution.
2. A Google Play release built from the same Phaser/Vite codebase via Tauri 2 Android.
3. Controller-playable on Retroid Pocket 3 (stock Android + standard HID gamepad) with the same Android build — no separate target.

iOS is explicitly deferred to a later plan.

## Approach

### Phase 0 — Pre-ship cleanup (blocks everything)
1. **Run pending Supabase migration** for `mode` and `company_id` columns (Known Issue in `state.md`). Until done, leaderboard parity across clients is broken.
2. **Asset size audit** — `npm run build` and inspect `dist/` total size. Play Store AAB cap is ~150MB (200MB with asset packs); large audio is the likely offender. Defer-load anything not on the menu critical path (already partially done via `MID_GAME_TRACKS`).
3. **Save schema versioning** — wrap `SaveSystem` reads in a `{v:N,...}` envelope with a migration step. Once shipped to Play we can't rename keys without breaking installs.
4. **CSP** — currently `csp: null` in `tauri.conf.json`. Set a real CSP that allows `https://djpliigclofvtfbzhkge.supabase.co` and nothing else. Same value reused by Android build.

### Phase 1 — PC release polish
1. Generate proper Windows icon set (existing icons are placeholder per the desktop standalone plan). Use real `icon.ico`.
2. Add `tauri-plugin-updater`. Configure it to read GitHub Releases. Auto-update on launch when newer version exists.
3. Decide on code signing:
   - **Option A**: Buy Windows code-signing cert (~$200/yr). Removes SmartScreen warning. Worth it if itch listing is public.
   - **Option B**: Ship unsigned, accept SmartScreen "unrecognized app" prompt. Fine for early access.
4. Add `dmg`/`appimage`/`deb` bundle targets to `tauri.conf.json` for future Mac/Linux. Don't build them yet — just keep config ready.
5. GitHub Actions workflow: on tag push (`v*`), Windows runner builds `.msi`/`.exe`, attaches to GitHub Release, updater feed picks it up.
6. Smoke test on a clean Windows machine (or VM) — fresh install, no dev tools, no network.

### Phase 2 — Controller support (gates Retroid playability + improves PC)
1. Enable Phaser gamepad in `main.ts` game config: `input: { gamepad: true }`.
2. Extend `InputSystem.ts` with a gamepad branch:
   - Left stick → same `SwipeInput` shape (`dx`, `dy`, `magnitude`) the rest of the game already consumes. No downstream changes.
   - A button → primary action (whatever pointer-down currently triggers).
   - B / Start → pause / back. Map to existing pause handlers.
   - Source priority each frame: gamepad if any axis > deadzone or button pressed in last N ms, else pointer/touch. Avoids fighting between inputs.
3. Audit scenes that read keyboard directly (`GameScene`, `TutorialArenaScene`, `HowToPlayScene`) — add gamepad equivalents alongside, don't replace.
4. Menu navigation: D-pad / left stick to move selection, A to confirm, B to back. Currently menus are pointer-only — needs a focus/highlight layer.
5. Test on:
   - PC with an Xbox controller plugged in.
   - Retroid Pocket 3 (real device once Android build exists).

### Phase 3 — Tauri Android scaffold
1. Install prerequisites: Android Studio, JDK 17, Android SDK (API 34+), NDK (r26+). Set `ANDROID_HOME`, `NDK_HOME`.
2. `npm run tauri android init` → generates `gen/android/` Gradle project. Commit it.
3. Adjust `tauri.conf.json` Android section:
   - `minSdkVersion`: 24 (covers Retroid Pocket 3 and ~98% of active devices).
   - `targetSdkVersion`: 34 (Play requirement floor as of late 2024+).
   - Orientation: landscape (game is landscape-only).
   - Use icons already at `src-tauri/icons/android/`.
4. First build: `npm run tauri android build --apk` (debug). Sideload to a phone over `adb install`.
5. Verify on Retroid Pocket 3:
   - Boots, hits menu.
   - Touch input still works.
   - Gamepad reads on Phaser side (Phase 2 must land first).
   - Audio unlocks on first input.
   - Frame rate acceptable on its mid-range Snapdragon 662.

### Phase 4 — Mobile-specific work
1. **Save storage**: localStorage works inside Tauri Android WebView but is sandboxed per-app and can be cleared by the OS. Add `tauri-plugin-store` as the persistent backing, fall back to localStorage for web. Keep API the same.
2. **Splash screen**: Tauri Android shows a default splash. Replace with branded splash matching boot loader visual.
3. **Touch UI scaling**: existing UI is sized for 1280x720. Verify it scales to phone aspects — particularly the Retroid's 750x1334 portrait panel running landscape.
4. **Back button handling**: Android hardware/gesture back must map to "back one menu" not "kill app". Hook Tauri Android back-button event.
5. **Audio**: AudioContext on Android requires a touch unlock — already handled. Re-test after Tauri build (WebView Chromium version may differ).
6. **Battery / perf**: drop max FPS cap to 60 on mobile (or whatever phone reports). Phaser already targets RAF; just verify.

### Phase 5 — Google Play submission
1. **Play Console account**: $25 one-time. Create app entry, declare it as a game.
2. **Signing**:
   - Generate upload keystore. Store keystore + passwords in GitHub Actions secrets.
   - Enroll in Play App Signing (Google holds the release key).
3. **Build release AAB**: `npm run tauri android build --aab --release`. Sign with upload key.
4. **Privacy policy**: required because Supabase = data collection. Host a single page (could be a `docs/privacy.md` rendered to GitHub Pages). URL goes in Play listing.
5. **Data safety form**: declare what's collected (callsign, score, mode, optional company_id) and that it's sent to Supabase.
6. **Store listing**: title, short description, full description, feature graphic (1024x500), screenshots (min 2, ideally 8), icon (already have).
7. **Content rating**: complete IARC questionnaire. Game has cartoon arcade combat — likely ESRB Everyone / PEGI 7.
8. **Internal testing track first**: invite-only, ~5 testers, no review queue. Catch crashes before promoting.
9. **Closed beta** → **production**. Promote when stable.

### Phase 6 — Post-ship dev loop
1. **Versioning script**: `scripts/bump-version.mjs` updates `package.json`, `tauri.conf.json`, `Cargo.toml`, and Android `versionCode` in lockstep. Run on every release.
2. **CI matrix**: Windows runner (msi), Ubuntu runner (Android AAB). Mac runner deferred with iOS.
3. **Crash telemetry**: Sentry or PostHog free tier wired into both PC and Android builds. Mobile bugs are unreproducible without it.
4. **Remote tuning**: keep gameplay-tuning JSON loadable from Supabase or a static URL so balance tweaks ship without store review.
5. **Backend compat**: Supabase schema changes must stay additive (nullable columns, never drop). Old client versions keep working.

## Scope boundaries
- **Out of scope**: iOS, Mac, Linux builds. App Store. TestFlight. iPadOS.
- **Out of scope**: TWA / PWA wrap as alternate Android path — committing to Tauri Android for one codepath.
- **Out of scope**: Steam, Epic, Microsoft Store. itch.io distribution = the only PC store target this plan covers.
- **Out of scope**: Multiplayer, any networked play beyond the existing leaderboard submit/fetch.
- **Out of scope**: In-app purchases, ads, monetization. Paid up-front or free.
- **Out of scope**: Rebuilding menus around controller as primary input; controller is added alongside touch/pointer, menus stay pointer-driven with controller as cursor proxy if Phase 2 step 4 is too heavy.

## Open questions
- Code signing cert for Windows: pay or skip for v1?
- Play Store: free or paid? Paid is one-tap simpler than ads, but cuts reach.
- Retroid landscape orientation: lock landscape, or allow rotation? (Retroid is fixed landscape physically.)
- Do we want the Tauri updater on PC, or rely on itch's own updater app?
- Does Phaser gamepad support carry through to Android Chromium WebView? Almost certainly yes (standard Gamepad API), but worth verifying with a debug-APK smoke test before committing to controller scope on Phase 5.
