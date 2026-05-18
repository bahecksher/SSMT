# 2026-05-18 1241 Rival Readability and Kill Window

## TL;DR
- What changed: Made rivals bigger, slower, more visually distinct, and killable if shield-hit again during their 1 HP flee.
- Why: Redline needed to read as a named ship and give the player more opportunity to catch her after forcing the retreat.
- What didn't work: The sandboxed build hit the Vite temp-file permission issue again; the escalated build passed.
- Next: Playtest whether the slower flee speed gives enough chase time without making rivals too easy.

---

## Full notes

Tuning changes:
- `RIVAL_RADIUS`: `13` -> `17`
- `RIVAL_SPEED`: `150` -> `118`
- `RIVAL_FLEE_SPEED`: `260` -> `185`
- `RIVAL_LASER_STRAFE_SPEED`: `70` -> `46`

Behavior changes:
- A shield hit while the rival is already fleeing now destroys the rival instead of being ignored.
- This preserves the first flee-at-1-HP beat, but gives the player a real follow-up window if they can catch the rival.

Visual changes:
- Added a visible forward laser hardpoint on the rival hull.
- Added a small hovering rival badge/icon above the ship that pulses during laser charge/fire.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
