# 2026-03-27 2152 Phase 6 Settings Bomb Shake

## TL;DR
- What changed: Added settings system, bomb power-up, screen shake effects, and collection delays for pickups
- Why: Phase 6 — settings, juice/feedback, and new gameplay mechanic
- What didn't work: N/A — clean implementation
- Next: Playtest all new features; consider audio

---

## Full notes

### Settings System
- New `SettingsSystem` module with `getSettings()` / `updateSettings()` API
- Persists to localStorage under `ssmt_settings` key
- Two settings: `screenShake` (bool) and `scanlines` (bool), both default ON
- Settings toggles added to:
  - Pause menu (under a SETTINGS divider)
  - Menu scene (top-right corner, compact SHAKE:ON/OFF and SCAN:ON/OFF buttons)
- Scanline toggle immediately shows/hides the HologramOverlay

### Bomb Power-up
- New `BombPickup` entity (orange circle with fuse visual, pulsing ring)
- 25% drop chance from killed enemies (alongside existing bonus point drops)
- 1.5s collection delay — pickup appears dimmed/flickering until collectable
- Once collected, player holds one bomb; HUD shows "BOMB [TAP]" indicator
- A BOMB button appears in bottom-right corner (visible only when bomb is held)
- Detonation clears ALL entities (drifters, beams, enemies, NPCs, shields, bonuses, bombs, salvage debris)
- Big white flash (0.85 alpha) + heavy camera shake (0.018 intensity, 400ms)
- New salvage debris respawns after 800ms delay

### Collection Delays
- Bonus point pickups now have a 1.5s collection delay (same mechanic as bomb)
- During delay, pickups render at reduced alpha with a fast flicker effect
- NPCs can still claim bonus pickups regardless of delay (as before)

### Screen Shake
- `Overlays.screenShake()` utility respects the settings toggle
- `Overlays.bombFlash()` combines white flash + heavy shake (used for bomb, game entry, extraction)
- Death: moderate shake (0.014, 350ms) alongside existing red wipe
- Extraction: bombFlash (flash+shake) alongside existing green wipe
- Game entry: bombFlash when countdown reaches zero ("GO")

### Files changed
- `src/game/constants.ts` — added SETTINGS_KEY
- `src/game/data/tuning.ts` — added bomb and collection delay constants
- `src/game/systems/SettingsSystem.ts` — new file
- `src/game/entities/BombPickup.ts` — new file
- `src/game/entities/BonusPickup.ts` — added collectionDelay, isCollectable(), dimmed draw
- `src/game/systems/DifficultySystem.ts` — bomb drop logic, consumeBombDrops()
- `src/game/ui/Hud.ts` — bomb indicator
- `src/game/ui/Overlays.ts` — screenShake(), bombFlash()
- `src/game/ui/HologramOverlay.ts` — setEnabled() method, respects settings on init
- `src/game/scenes/GameScene.ts` — bomb integration, settings in pause menu, flash/shake effects
- `src/game/scenes/MenuScene.ts` — settings toggles
- `docs/decisions.md` — Phase 6 decision entry
- `docs/state.md` — rewritten
