# 2026-05-18 1235 Redline Laser Variance

## TL;DR
- What changed: Redline's laser now tracks briefly, commits to an imperfect line, fires for less time, and strafes during the tell.
- Why: The first version hard-locked through the whole charge and could obliterate the player once in range.
- What didn't work: The sandboxed build hit the Vite temp-file permission issue again; the escalated build passed.
- Next: Playtest whether the committed beam feels dodgeable without losing its threat.

---

## Full notes

Adjusted Redline laser tuning:
- Charge increased from `1150ms` to `1350ms`.
- New tracking window: `520ms`.
- Active lethal window reduced from `620ms` to `420ms`.
- New aim variance: `+/- 7deg`.
- New charge strafe speed: `70px/s`.

Behavior change:
- Redline only tracks the player during the first part of the warning.
- After that, the beam line remains committed while Redline drifts/strafs.
- The final laser fires along the committed line instead of continuously re-locking onto the player.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
