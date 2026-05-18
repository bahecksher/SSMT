# 2026-05-18 1244 Rival Flee Chance and Beam Window

## TL;DR
- What changed: Slowed Redline down, lengthened the lethal laser window, and made the low-HP flee a 75% chance instead of guaranteed.
- Why: The rival should be easier to chase/counter, while the laser can stay threatening for longer.
- What didn't work: The sandboxed build hit the Vite temp-file permission issue again; the escalated build passed.
- Next: Playtest whether the longer beam plus slower movement lands in the right pressure range.

---

## Full notes

Tuning changes:
- `RIVAL_SPEED`: `118` -> `104`
- `RIVAL_FLEE_SPEED`: `185` -> `165`
- `RIVAL_FLEE_CHANCE`: new, `0.75`
- `RIVAL_LASER_ACTIVE_MS`: `420` -> `640`

Behavior:
- When a non-fleeing rival would be reduced to 1 HP or lower, it now has a 75% chance to flee.
- On the 25% failure case, that hit destroys the rival outright.
- Follow-up shield hits during an active flee still destroy the rival.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
