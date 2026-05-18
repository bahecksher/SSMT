# 2026-05-18 1236 Redline Full Beam Range

## TL;DR
- What changed: Extended Redline's laser range so the committed beam crosses the screen like regular laser hazards.
- Why: The short attached beam felt unlike the established laser language once the dodge timing felt better.
- What didn't work: The sandboxed build hit the Vite temp-file permission issue again; the escalated build passed.
- Next: Playtest whether the full-screen beam is readable with the new imperfect lock behavior.

---

## Full notes

Changed `RIVAL_LASER_RANGE` from `620` to `1400`.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
