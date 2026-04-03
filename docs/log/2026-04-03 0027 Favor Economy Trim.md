# 2026-04-03 0027 Favor Economy Trim

## TL;DR
- What changed: Set every liaison favor to a flat `2000c` and capped MissionSelect at two armed favors per run.
- Why: The user wanted favors to be cheaper while still limiting how much boost stacking can happen at once.
- What didn't work: The previous fixed-price setup was still tuned for premium multi-exfil purchases, and selection rules did not stop a third favor if the wallet could cover it.
- Next: Playcheck the cheaper two-favor economy in MissionSelect and make sure the new `MAX 2` state reads clearly on phone-sized screens.

---

## Full notes

Short economy pass outside the active layered-music plan. This session intentionally diverged to handle a direct balance request, and the current music plan remains the active long-range plan in `state.md`.

Code changes stayed small:
- `src/game/data/companyData.ts` now returns a flat `2000c` favor cost for every company's fixed liaison offer.
- `src/game/scenes/MissionSelectScene.ts` now enforces a hard cap of two selected favors and marks further cards as `MAX 2` until one selected favor is removed.

Verification:
- Ran `npm.cmd run build` successfully on the updated worktree.
