# 2026-03-27 1523 Shield Break Grace

## TL;DR
- What changed: Added a 0.5 second invulnerability window after the player's shield absorbs a hit.
- Why: User wanted a brief grace period after shield break so chained hazards feel less unfair.
- What didn't work: Nothing blocked; build passed after the tuning and collision-path update.
- Next: Playtest whether 0.5s feels right or needs a little more/less.

---

## Full notes

- Added `PLAYER_SHIELD_BREAK_INVULN_MS = 500` in tuning.
- When the player's shield is consumed in `GameScene`, the invulnerability timer is refreshed to at least that value.
- This reuses the existing invulnerability blink/path rather than adding a second separate state machine.
- Verified with `npm.cmd run build`; build succeeded with the same existing large chunk warning.
