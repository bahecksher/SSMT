# 2026-04-23 1643 Music Sync Followup

## TL;DR
- What changed: After the 04-22 bug-fix pass left the phase 3→4 crossfade off-beat (drums-3 / bass-3 / gameSynth were started by the late-load guard at whatever absolute time they decoded), expanded `BOOT_TRACKS` to include all six layered tracks so they all enter `startMusic`'s for-loop in the same frame with the same `MUSIC_START_DELAY_S`. Also locked the phase 5+ full track to `fullPhase2` (was random between fullPhase1/fullPhase2). Committed and pushed everything still pending from the 04-22 pass + the Tauri scaffolding from 04-16.
- Why: User chose option (a) of two proposals — boot-load everything for guaranteed sync at the cost of ~1-2MB more boot weight — over option (b) seek-based alignment. User also confirmed `fullPhase2` is the preferred standard for phase 5+.
- What didn't work: Earlier `resyncGameplayMusic` attempt (stop+replay each layered track on `GameScene.create`) broke beat sync because the tracks ended up restarted at slightly different audio-context times. Reverted; the fix is "never `.stop()` a layered track once it's started, only fade volumes."
- Next: User to smoke-test the phase-4 transition and phase-5 swap in browser. Tauri Rust install + packaged-app smoke test still the open distribution thread.

---

## Full notes

### Sync architecture (now load-bearing, worth writing down)
Layered tracks in `MusicSystem` are sample-aligned by being started in the same `startMusic` for-loop iteration with a shared `MUSIC_START_DELAY_S = 0.05`. From that point on they are NEVER `.stop()`ed — only their volumes fade via `tweenSoundVolume`. A muted track is still running silently and remains in lockstep with the audible ones, so when its volume is faded back up (e.g., bass-1 going from 0 on the menu to 1 on MissionSelect, or drums-3/bass-3 entering at phase 4) it lands on the beat.

This means anything that loads after `layeredStarted` is true is at risk of being out of phase. The 04-22 late-load guard in `ensureLayeredSounds` solved the silent-cutout regression but couldn't solve the beat-alignment problem — late-loaded tracks start at whatever absolute audio-context time their decode finishes, which is several hundred ms or more behind the boot-loaded tracks.

### Fix: expand BOOT_TRACKS
Changed `BOOT_TRACKS` to contain all six layered tracks rather than the original three. `MID_GAME_TRACKS` is now empty:

```ts
const BOOT_TRACKS = ['menuSynth', 'bassOne', 'drumsTwo', 'drumsThree', 'bassThree', 'gameSynth'] as const;
const MID_GAME_TRACKS = [] as const;
```

Tradeoff is ~1-2MB extra at boot. Acceptable. The full tracks (`fullPhase1`, `fullPhase2`) remain late-loaded since they are never crossfaded against the layered set — they swap in/out cleanly at the phase 5+ boundary on their own play start.

### Late-load guard kept as safety net
`ensureLayeredSounds` still has the play-on-discovery guard added on 04-22:

```ts
if (layeredStarted && !scene.sound.locked && !sound.isPlaying) {
  sound.play({ delay: MUSIC_START_DELAY_S, loop: true, volume: 0 });
}
```

With all six tracks now in `BOOT_TRACKS` this branch shouldn't fire. Left in to prevent the silent-cutout regression if a track ever moves out of `BOOT_TRACKS` again. The accompanying comment still warns about beat misalignment for late-loaded tracks; technically dead text now, but it's the right warning if someone re-introduces the late-load case.

### Phase 5+ track locked to fullPhase2
`selectedLateGameTrack` was being chosen randomly from `LATE_GAME_TRACKS`. User preference: `fullPhase2` always. Defaulted the field if unset:

```ts
if (!selectedLateGameTrack) {
  selectedLateGameTrack = 'fullPhase2';
}
```

Did not delete `fullPhase1` from `FULL_TRACKS` / `MUSIC_PATHS` in case the random choice gets restored later or `fullPhase1` is wired into a different path.

### What got committed
Single commit covered everything still pending in the working tree:
- Tauri 2 desktop scaffolding (from 04-16): `src-tauri/`, `tauri:build` script in `package.json`, relative asset paths in `vite.config.ts`, `index.html` adjustments, offline-aware `LeaderboardService`, removed DEBUG PHASE pause menu UI in `GameScene` and `BootScene`, placeholder icon source `public/company-logo.gif.gif`.
- 04-22 bug-fix pass: `MusicSystem` late-load guard, `MissionSelectScene` brief text clamp, `GameScene` hidden Shift+1..0 / `window.bitpJumpToPhase(n)` debug shortcut, `SfxSystem` placeholder `beamFire` entry, `BeamHazard` SFX trigger.
- 04-23 music sync followup: `BOOT_TRACKS` expansion, `selectedLateGameTrack = 'fullPhase2'` default.
- All accompanying log/plan/state docs.

Excluded from commit: `.claude/` (local Claude Code config — has `settings.local.json`), `Bit-P-AI-lot.code-workspace` (personal VS Code workspace file). Both are user-environment-specific, not project state.

### Verification
- `npm.cmd run build` passes, no TS errors.
- Did not run a fresh dev server this session for the sync change. User should smoke-test:
  1. Menu music kicks on after first input.
  2. Bass-1 enters on the beat on MissionSelect.
  3. Phase 3→4: drums-3 / bass-3 fade in on the beat (this is the one that was off-beat before this pass).
  4. Phase 5: `fullPhase2` swaps in (not `fullPhase1`).
  5. Existing 04-22 verifications: MissionSelect brief clamp, Shift+5 debug jump, beam zap.

### Known issues / open questions
- Comment in `ensureLayeredSounds` is now misleading (tracks won't be late-loaded in practice). Worth a one-line tightening on a future pass.
- `PHASE_LENGTH = 30s` vs. layered loop durations still unmeasured. Captured in state.md.
- Beam SFX still placeholder. Captured in state.md.
- Tauri Rust install + packaged-app smoke test still pending. Captured in state.md.
