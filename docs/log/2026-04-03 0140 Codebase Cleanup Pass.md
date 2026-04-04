# 2026-04-03 0140 Codebase Cleanup Pass

## TL;DR
- What changed: Created CommPanel base class and refactored all three comm panels to extend it (~600 lines of duplication eliminated). Extracted shared geometry.ts and linePicker.ts utilities. Fixed 5 bugs, removed 6 pieces of dead code, fixed 1 perf issue. Removed duplicate local colorStr from MissionSelectScene. Reviewed all files added/changed by the other AI — all clean.
- Why: User requested cleanup pass after another AI had been working on the codebase.
- What didn't work: N/A — all changes built cleanly.
- Next: Extract shared background simulation and settings UI (identified duplication, deferred as too large for this pass).

---

## Full notes

### New files created
- `src/game/ui/CommPanel.ts` — shared base class for all comm panels with layout constants, CommPanelStyle interface, show/hide/pinned layout methods, panel drawing, pulse/scan tweens
- `src/game/utils/geometry.ts` — `rotatePoint`, `colorStr`, `darkenColor` shared utilities
- `src/game/utils/linePicker.ts` — generic no-repeat line picker factory

### Files refactored
- `src/game/ui/SlickComm.ts` — now extends CommPanel, kept createSlickPortrait export
- `src/game/ui/RegentComm.ts` — now extends CommPanel, kept createRegentPortrait factory
- `src/game/ui/LiaisonComm.ts` — now extends CommPanel, kept createLiaisonPortrait export with 4 company-specific portrait factories

### Bug fixes
- DrifterHazard.createFragment: added missing `inverted`, `bounceCount`, `depletedTimer`, `miningPulse` initialization
- DifficultySystem: beam-killed enemies now drop bombs (was inconsistent with normal death path)
- SalvageDebris: hoisted rotatePoint call outside map callback (perf fix)
- InputSystem: removed unreachable SWIPE_DEAD_ZONE branch
- ExitGate: removed unused `ringPulse` field and increments, fixed unused `delta` parameter

### Dead code removed
- `Overlays.deathInversionSequence` (never called)
- `GameScene.handlePointerDown` (dead method + event registration)
- `CustomCursor.SHOW_CIRCLE` (always true, inlined)
- Duplicate JSDoc on `clearBoard()`
- Stale debug comment in GameScene
- `createSlickPortraitLegacy` (removed during SlickComm rewrite)

### Other AI review
- `SfxSystem.ts` — clean, well-structured with typed SfxName union
- `portraitPrimitives.ts` — clean helper utilities for portrait rendering
- `MusicSystem.ts` — clean, proper layered/full track architecture
- `DifficultySystem.ts` — asteroid collision SFX cooldown added properly
- `MissionSelectScene.ts` — had local `colorStr` duplicate, replaced with import from utils/geometry

### Deferred
- Background simulation extraction (MenuScene/MissionSelectScene share ~180 lines)
- Settings UI extraction (3 scenes duplicate settings panel code)
- Mass migration of inline color conversions to colorStr() (cosmetic only)
