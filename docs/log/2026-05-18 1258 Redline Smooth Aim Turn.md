# 2026-05-18 1258 Redline Smooth Aim Turn

## TL;DR
- What changed: Redline's hull now turns toward the laser aim instead of snapping to face the player.
- Why: The snap during laser charge felt abrupt and less physical.
- What didn't work: The sandboxed build hit the Vite temp-file permission issue again; the escalated build passed.
- Next: Check whether hull rotation now visually trails the laser in a satisfying way.

---

## Full notes

Behavior change:
- `lockLaser()` no longer directly assigns `heading = laserAngle`.
- Added capped `turnTowardAngle()` for hull rotation.
- Laser aim can still update/commit as before, but the ship body rotates toward it using the rival turn-rate cap.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
