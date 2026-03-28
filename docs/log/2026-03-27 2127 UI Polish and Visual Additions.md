# 2026-03-27 2127 UI Polish and Visual Additions

## TL;DR
- What changed: Fixed scaling issues across HUD, pause menu, results screen, and menu layout for phone screens. Reworked gate with closing-circle preview and flicker. Added rotating geo-sphere background. Updated all Slick/Regent dialogue. Added Regent threat detection on phase 2. Fixed asteroid hitboxes. Starfield now drifts east-to-west.
- Why: Responsive layout from prior session broke formatting on various screen sizes, especially phones. Gate needed better player anticipation. Visual depth wanted.
- What didn't work: N/A — all changes compile and build clean
- Next: Playtest gate timing feel, geo-sphere visual weight, and phone layout on multiple devices

---

## Full notes

### HUD fixes
- Credits text shrunk from 20px to 14px
- Gate timer (`GATE: Ns`) removed from HUD entirely
- Pause button moved from bottom-center to top-right as compact 44x28 `||` button
- Shield text repositioned to avoid overlap

### Pause menu
- Panel height increased from 0.26 to 0.34 of gameHeight so RESUME, ABANDON RUN, and hint text all fit inside the border

### Results/death screen
- Removed "BEST" score display from results overlay
- Comms pinned higher (0.48 instead of 0.53) to avoid overlapping TAP TO RETRY
- Panel now stretches to bottom edge minus 50px
- TAP TO RETRY and MENU anchored from panel bottom (68px and 30px up) instead of percentage-based

### Menu layout (phone fix)
- "How to play" and "TAP TO START" anchored from bottom edge instead of percentage Y
- Leaderboard rows capped to available space so they never overlap bottom UI
- Backing panel stretches to fill available height

### Gate rework
- Gate visual spawns 10s before activation (`EXIT_GATE_PREVIEW = 10_000`)
- Preview: large circle (6x radius) closes in toward gate center
- Extractable window: 3s (`EXIT_GATE_DURATION = 3_000`) with salvage-style gentle flicker (alpha 1/0.3)
- Small white flash on dim frames
- Comms trigger when gate becomes extractable, not when it first appears
- `EXIT_GATE_GRACE_DELAY` removed, replaced by preview/active lifecycle

### Asteroid hitboxes
- Added `circleIntersectsPolygon()` in collision.ts
- Player radius (5px) now factored into drifter collision — death triggers on visual contact

### Geo-sphere background
- Wireframe icosphere (2 subdivisions) at depth -0.5
- Positioned deep in bottom-right corner, only a sliver visible
- Very slow rotation (0.006 rad/s, ~17min per revolution)
- Present on both menu and game scenes

### Dialogue updates
- All Slick and Regent lines updated to user's revised text
- Added `threatDetected` Regent key with 50% trigger chance at phase 2 start

### Starfield
- Stars now drift east-to-west (right-to-left) instead of north-to-south
