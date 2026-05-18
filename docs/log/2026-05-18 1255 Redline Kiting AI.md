# 2026-05-18 1255 Redline Kiting AI

## TL;DR
- What changed: Redline now kites/orbits the player instead of directly ramming while waiting for laser shots.
- Why: A laser rival should feel like a duelist managing distance, not a normal enemy ship with an attached beam.
- What didn't work: The sandboxed build hit the Vite temp-file permission issue again; the escalated build passed.
- Next: Playtest whether the distance bands give enough shield-ram opportunities without making Redline too passive.

---

## Full notes

Added tuning:
- `RIVAL_KITE_MIN_DISTANCE = 210`
- `RIVAL_KITE_IDEAL_DISTANCE = 320`
- `RIVAL_KITE_MAX_DISTANCE = 460`

Behavior:
- During hunt, Redline now tries to keep distance and orbit around the player.
- If the player gets too close, she steers away.
- If she gets too far, she repositions closer to an ideal firing band.
- She only starts charging the laser when cooldown is ready and she has enough room for the shot.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
