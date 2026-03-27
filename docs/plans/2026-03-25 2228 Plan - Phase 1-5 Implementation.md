# Plan: Bit-P-AI-lot Game Development (Phases 1-5)

## Context

The user has a complete spec for an original browser-based 2D arcade survival-extraction game. The project is completely fresh -- zero code exists, only the spec and documentation scaffolding. The game must be mobile-first (touch input, portrait orientation) using TypeScript, Phaser 3, and Vite. The goal is to implement through Phase 5 (beam hazards + difficulty scaling), deferring audio/settings to Phase 6.

---

## Critical Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Virtual resolution | **540 x 960** (portrait 9:16) | Matches mobile phones, Phaser `Scale.FIT` handles all device scaling |
| Input | **Pointer-follow with lerp** | Unified touch/mouse via `activePointer`, no virtual joystick needed |
| Collisions | **Manual distance checks** (no Phaser physics) | Circle-circle and point-to-segment are trivial, fast, and debuggable |
| Rendering | **Phaser Graphics objects** (no sprite atlas) | Neon geometry style maps perfectly, zero asset loading for gameplay |
| Systems | **Plain classes, not Phaser objects** | Instantiated in GameScene, `update(delta)` called from scene loop |
| Entities | **Wrap a Graphics object, own their update** | Created by scene/system, expose position + radius for collision |

---

## Phase 1: Scaffold, Scenes, Player Movement, HUD Shell

**Create:**
- `index.html` -- full-viewport `<div id="game">`, meta viewport to prevent zoom, CSS `overflow: hidden; overscroll-behavior: none`
- `vite.config.ts` -- `base: './'`, no plugins
- `package.json` / `tsconfig.json` -- via `npm create vite@latest`, then `npm install phaser`
- `src/main.ts` -- creates `new Phaser.Game(gameConfig)`
- `src/game/config.ts` -- Phaser config: `Scale.FIT`, `CENTER_BOTH`, 540x960, no physics, `type: AUTO`
- `src/game/constants.ts` -- `GAME_WIDTH`, `GAME_HEIGHT`, `SCENE_KEYS`, `COLORS` palette, `SAVE_KEY`
- `src/game/types.ts` -- `SaveData`, `PhaseConfig`, `GameState` enum
- `src/game/data/tuning.ts` -- player follow speed, max speed, radius (other values added in later phases)
- `src/game/scenes/BootScene.ts` -- instant transition to Menu
- `src/game/scenes/MenuScene.ts` -- title text, best score, "TAP TO START" on pointerdown
- `src/game/scenes/GameScene.ts` -- creates Player + InputSystem, runs update loop
- `src/game/scenes/GameOverScene.ts` -- receives score/cause data, tap to restart or menu
- `src/game/systems/InputSystem.ts` -- reads `activePointer`, exposes `getTarget()`, only updates while `pointer.isDown`
- `src/game/entities/Player.ts` -- small triangle/diamond in cyan, lerps toward input target, clamped to arena
- `src/game/ui/Hud.ts` -- shell with static placeholder text (score: 0, timer: --)
- `src/game/ui/Buttons.ts` -- reusable touch-friendly button (min 80x48 virtual px)

**Verify:** `npm run dev` works, canvas scales on mobile, full scene flow Boot->Menu->Game->GameOver->Game, player follows finger/mouse smoothly, stays in bounds.

---

## Phase 2: Salvage Debris, Score Accumulation

**Create:**
- `src/game/entities/SalvageDebris.ts` -- large shape in amber, dashed salvage radius circle, drifts slowly, despawns when offscreen (new one respawns elsewhere after brief delay)
- `src/game/systems/SalvageSystem.ts` -- distance check player-to-debris, accrues score when in range
- `src/game/systems/ScoreSystem.ts` -- holds `unbankedScore`/`bankedScore`, pure data, `addUnbanked()`/`bankScore()`/`clearUnbanked()`

**Modify:**
- `tuning.ts` -- add `SALVAGE_RADIUS`, `SALVAGE_POINTS_PER_SECOND`, `SALVAGE_DRIFT_SPEED_MIN/MAX`
- `GameScene.ts` -- instantiate debris + salvage/score systems, wire into update loop
- `Hud.ts` -- display live unbanked score from ScoreSystem

**Verify:** Debris drifts and wraps, salvage radius visible, score accrues only inside radius, HUD updates live.

---

## Phase 3: Drifter Hazard, Collisions, Death, Restart

**Create:**
- `src/game/entities/DrifterHazard.ts` -- small red shape, spawns from edge, crosses arena in a straight line, self-destructs offscreen
- `src/game/systems/CollisionSystem.ts` -- circle-circle checks: player vs drifters (death), player vs gate (extraction, Phase 4)
- `src/game/data/phaseConfig.ts` -- basic `getPhaseConfig()` with spawn rate and speed multiplier
- `src/game/ui/Overlays.ts` -- death screen flash (200-300ms red flash)

**Modify:**
- `tuning.ts` -- add `DRIFTER_SPEED_BASE`, `DRIFTER_RADIUS`, `DRIFTER_SPAWN_RATE_BASE`
- `GameScene.ts` -- basic drifter spawn timer, wire collision system, handle death state transition
- `GameOverScene.ts` -- show "DESTROYED" on death

**Verify:** Drifters spawn from edges, touching one kills player, death flash plays, GameOver shows correctly, restart is clean with no leftover entities.

---

## Phase 4: Extraction, Exit Gate, Banking, Save

**Create:**
- `src/game/entities/ExitGate.ts` -- pulsing green circle at arena edge, visible lifetime countdown, self-destructs after duration
- `src/game/systems/ExtractionSystem.ts` -- 30s phase timer, spawns gate, manages gate lifecycle, exposes `getTimeToGate()`
- `src/game/systems/BankingSystem.ts` -- on gate reached: bank score via ScoreSystem, save via SaveSystem, signal scene transition
- `src/game/systems/SaveSystem.ts` -- localStorage wrapper with try/catch, `saveBestScore()`, `getBestScore()`

**Modify:**
- `tuning.ts` -- add `PHASE_LENGTH`, `EXIT_GATE_DURATION`, `EXIT_GATE_RADIUS`
- `CollisionSystem.ts` -- add player-vs-gate check
- `Hud.ts` -- gate countdown timer, "GATE OPEN" flash when active
- `GameOverScene.ts` -- "EXTRACTED" path with banked score display
- `MenuScene.ts` -- load and show best score from SaveSystem

**Verify:** Gate countdown in HUD, gate appears at 30s, reaching it triggers extraction, score persists in localStorage, ignoring gate continues to harder phase, dying loses score.

---

## Phase 5: Beam Hazard, Difficulty Scaling, Polish

**Create:**
- `src/game/entities/BeamHazard.ts` -- two-phase: warning (thin flickering line, 1.5s) then active (thick bright line, 0.8s, lethal). Axis-aligned only (horizontal/vertical).
- `src/game/systems/DifficultySystem.ts` -- tracks phase number, uses `getPhaseConfig()` to determine spawn rates/speeds, orchestrates all hazard spawning, owns active hazard list

**Modify:**
- `tuning.ts` -- add beam values, difficulty scaling values
- `phaseConfig.ts` -- full implementation with beam enable at phase 3, spawn/speed scaling
- `GameScene.ts` -- replace basic spawner with DifficultySystem
- `CollisionSystem.ts` -- add point-to-line-segment check for beams (only lethal during active phase)
- `Hud.ts` -- add phase counter

**Verify:** Phase increments every 30s, drifters get faster/more frequent, beams start at phase 3, beam telegraph is readable, beam kills during active phase only, game runs at 60 FPS on mobile through phase 5+.

---

## Key Implementation Notes

- **Debris respawn**: When debris exits arena, despawn it and spawn a new one at a random position after a brief delay (~1-2s). This creates tension windows with no salvage opportunity.
- **Score precision**: Accumulate as float internally, display as integer
- **Exit gate position**: Inset ~60px from wall so gate is fully visible and player doesn't get trapped at edge
- **Extraction transition**: 500ms freeze with "EXTRACTED" text, then scene transition
- **Touch input**: Only update target while `pointer.isDown` to prevent stale position after finger lift
- **Object cleanup**: Every entity's `destroy()` must call `graphic.destroy()`. DifficultySystem cleans up offscreen hazards.
- **Performance**: Only update HUD text when values change. Use `setPosition()` not full redraw for movement. Pre-allocate vectors in hot paths.

---

## Verification

After each phase:
1. Run `npm run dev` and test in desktop browser
2. Test on mobile device via local network (`vite --host`)
3. Run through the phase's test checklist (listed above per phase)
4. Check for entity cleanup: play 3+ runs in a row, verify no memory leaks via DevTools
5. Check 60 FPS on mobile via Chrome DevTools Performance tab

---

## Resolved Design Questions

1. **Debris**: Despawn and respawn elsewhere (not wrap). Creates brief no-salvage windows that add tension.
2. **Score display**: Integer only in HUD. Accumulate as float internally.
3. **Exit gate position**: Inset ~60px from arena edge so gate is fully visible.
