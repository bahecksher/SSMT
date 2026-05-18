# 2026-05-18 1256 Removed Redline Charge Badge

## TL;DR
- What changed: Removed the floating plus/badge from Redline's ship.
- Why: The traced laser line already communicates charge direction, so the badge was redundant visual noise.
- What didn't work: The sandboxed build hit the Vite temp-file permission issue again; the escalated build passed.
- Next: Continue visual tuning from the laser trace and ship silhouette only.

---

## Full notes

Removed the floating charge badge/plus icon from `RivalShip.draw()`.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
