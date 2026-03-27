# Plan - Gameplay Feel and Difficulty
_Created: 2026-03-25 2328_

## Goal
Improve controls responsiveness, ramp difficulty harder, make salvage feel more alive, and add scoring feedback.

## Approach

### 1. Responsive controls
- Replace fixed lerp with distance-proportional velocity: far touch/flick = fast, close touch = slow
- Higher max speed (600), higher follow speed (0.25), 8px dead zone for fine control
- `PLAYER_DISTANCE_SCALE` tuning constant controls how aggressively distance maps to speed

### 2. Asteroid scaling per phase
- Drifter count ramps aggressively: `3 + phase*2 + phase^1.6` (4→7→12→18→25)
- Size pools per phase: phase 1 = all normal, phase 3+ = mix of 0.6x to 2.2x radius
- Larger asteroids move slower (1/sqrt(scale)), collision uses per-drifter radius

### 3. Salvage drifts from edge
- Spawns from random screen edge, aimed at the arena interior
- Drifts through and exits the other side (same despawn logic)

### 4. Scoring feedback + rare salvage
- Floating "+N" text when player is inside salvage radius (every 500ms)
- Rare salvage (purple, phase 2+): smaller radius (0.6x), higher points (2x + 0.5x per phase), 10s lifetime with blink warning
- Rare salvage spawns every ~15s (faster in higher phases, min 8s)

## Scope boundaries
- No audio changes (Phase 6)
- No new HUD elements for rare salvage (relies on visual distinctness + floating text)

## Open questions
- Tuning values may need adjustment after playtesting
