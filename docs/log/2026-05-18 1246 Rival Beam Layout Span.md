# 2026-05-18 1246 Rival Beam Layout Span

## TL;DR
- What changed: Redline's beam endpoint now derives from the current layout diagonal instead of relying only on a fixed range.
- Why: On larger screens or long diagonals, the rotating full-screen beam could still stop near an edge.
- What didn't work: The sandboxed build hit the Vite temp-file permission issue again; the escalated build passed.
- Next: Test the rotating beam on wide desktop and portrait/mobile layouts.

---

## Full notes

Changed Redline laser range handling:
- Added `RIVAL_LASER_TRIGGER_RANGE = 620` so attack engagement distance remains stable.
- Kept `RIVAL_LASER_RANGE = 1400` as the minimum visual/collision span.
- `RivalShip.updateLaserFromAngle()` now uses `max(RIVAL_LASER_RANGE, hypot(gameWidth, gameHeight) * 2.2)` for the beam endpoint.

This should keep the beam visually and collision-wise extended beyond the screen at every rotation angle without making Redline fire from much farther away on wide displays.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
