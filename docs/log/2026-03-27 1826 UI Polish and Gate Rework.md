# 2026-03-27 1826 UI Polish and Gate Rework

## TL;DR
- What changed: HUD credits shrunk, pause button moved to top-right, gate timer removed from HUD, pause panel enlarged, best score removed from results screen, asteroid hitboxes fixed, gate reworked with closing-circle preview + flicker active state, rotating geo-sphere added behind arena
- Why: Responsive layout broke several UI elements; gate needed better anticipation; visual depth wanted
- What didn't work: N/A — all changes compile and build clean
- Next: Playtest gate timing feel, sphere visual weight, and flickering gate readability

---

## Full notes

### UI fixes (from prior session scaling issues)
- **Credits text**: Reduced HUD base font from 20px to 14px
- **Pause panel**: Increased panel height from 0.26 to 0.34 of gameHeight so all content fits inside the border
- **Pause button**: Moved from bottom-center to top-right (y=42, right-aligned) as a compact 44x28 button
- **Gate timer**: Removed `GATE: Ns` text and `timerText` from HUD entirely — user has a different plan for gate indication
- **Results "BEST" score**: Removed from destroyed/extracted overlay; repositioned TAP TO RETRY and MENU buttons up
- **Asteroid hitboxes**: Added `circleIntersectsPolygon()` that checks player radius against polygon edges, not just center-in-polygon. Drifter and enemy collisions now trigger on visual contact.

### Gate rework
- Gate visual now spawns 10s before becoming extractable (`EXIT_GATE_PREVIEW = 10_000`)
- Preview shows a large circle (6x gate radius) that closes in toward the gate center over the preview period
- Gate extractable window reduced from 5s to 3s (`EXIT_GATE_DURATION = 3_000`)
- Active gate flickers on/off (accelerating blink like depleted salvage) with a white flash on each blink-out
- Comms now trigger when `extractable` becomes true (via `justBecameExtractable` flag), not when gate spawns
- `EXIT_GATE_GRACE_DELAY` removed — replaced by the preview/active lifecycle

### Geo-sphere background
- New `GeoSphere` entity: icosphere (2 subdivisions) rendered as wireframe with depth-based alpha
- Placed at depth -0.5 (between starfield at -1 and arena at 0), non-interactive
- Positioned in bottom-right corner at 0.9x viewport scale so only a portion is visible
- Slow Y-axis rotation with gentle X-axis wobble
