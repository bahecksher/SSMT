# 2026-05-18 1239 Redline Laser Sweep

## TL;DR
- What changed: Redline's fired laser now slowly sweeps toward the player while remaining a straight full-screen beam.
- Why: The beam should feel like the rival is actively trying to connect without returning to perfect lock-on.
- What didn't work: The sandboxed build hit the Vite temp-file permission issue again; the escalated build passed.
- Next: Playtest whether `38deg/s` feels threatening but fair.

---

## Full notes

Added `RIVAL_LASER_SWEEP_DEG_PER_SEC = 38`.

Behavior:
- Warning still briefly tracks, then commits with aim variance.
- During the lethal window, the straight beam rotates toward the player's current position at the capped sweep speed.
- The beam remains full-screen length and keeps the shorter lethal duration from the previous tuning pass.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
