# 2026-05-18 1257 Rival Arena Containment

## TL;DR
- What changed: Redline is now kept inside the arena while fighting.
- Why: Kiting velocity could carry her outside the reachable field before she was actually fleeing.
- What didn't work: The sandboxed build hit the Vite temp-file permission issue again; the escalated build passed.
- Next: Confirm Redline stays hittable during hunt/laser states but still exits during flee.

---

## Full notes

Added arena containment to `RivalShip`:
- Applies after movement while Redline is fighting.
- Clamps her position inside the arena with padding.
- Applies a small velocity bounce when she hits a boundary.
- Does not apply during `flee` / `escaped`, so intentional escapes still work.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
