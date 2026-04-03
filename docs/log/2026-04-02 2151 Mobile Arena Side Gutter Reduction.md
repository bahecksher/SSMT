# 2026-04-02 2151 Mobile Arena Side Gutter Reduction

## TL;DR
- What changed: Reduced the arena's left/right gutters on narrow/mobile viewports by giving horizontal insets their own smaller sizing rule while keeping the existing top and bottom arena insets
- Why: The user felt the arena looked too slim on mobile and wanted less side gutter
- What didn't work: No live phone playcheck happened in-session; verification stayed at `npm.cmd run build`
- Next: Check gameplay on a real phone-sized viewport and tune the horizontal inset again if the arena still feels too narrow or starts crowding the side edges

---

## Full notes

- This session intentionally diverged from the active layered-music plan to address a direct user-requested gameplay layout adjustment.
- Updated `src/game/layout.ts` only.
- Narrow viewports now use a smaller horizontal inset cap/floor, but the arena's top and bottom insets still follow the previous sizing so HUD and bottom gameplay UI retain their vertical breathing room.
- Verified with `npm.cmd run build`.
