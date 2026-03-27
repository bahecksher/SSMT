# 2026-03-27 1456 Death Label Copy

## TL;DR
- What changed: The death result screen now says `CREDITS LOST` instead of `SCORE LOST`.
- Why: User wanted the death screen wording to match the HUD's credits terminology.
- What didn't work: Nothing blocked; build passed after the copy update.
- Next: Keep an eye on any other UI copy that still says score when it should say credits.

---

## Full notes

- Updated the death-only result label in `GameScene` to use `CREDITS LOST`.
- Left extraction wording as `SCORE:` for now, since the user only requested the death copy change in this pass.
- Verified with `npm.cmd run build`; build succeeded with the same existing large chunk warning.
