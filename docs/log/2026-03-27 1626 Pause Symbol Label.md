# 2026-03-27 1626 Pause Symbol Label

## TL;DR
- What changed: Replaced the live bottom pause button label from `PAUSE` to `||`.
- Why: The user wanted the pause symbol instead of the word.
- What didn't work: Nothing blocking; build passed.
- Next: Playtest the symbol readability on desktop and mobile.

---

## Full notes

This was a small follow-up within the existing pause-feature work.

Changed the bottom in-run button label only:
- unpaused state now shows `||`
- paused state still shows `RESUME`

Verification:
- `npm.cmd run build`
