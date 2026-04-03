# 2026-04-02 2133 Mission Favor Card Copy Format

## TL;DR
- What changed: Reworked MissionSelect favor cards to use the requested two-line copy layout, with company plus liaison on the first line and favor plus cost on the second
- Why: The user asked for a simpler mission-page favor format
- What didn't work: No live phone playcheck happened in-session; verification stayed at `npm.cmd run build`
- Next: Check the MissionSelect cards on a real phone-sized viewport to see whether either line still needs font-size or wrap tuning

---

## Full notes

- This session intentionally diverged from the active layered-music plan to address a direct user-requested MissionSelect UI copy change.
- Updated `src/game/scenes/MissionSelectScene.ts` only; purchase logic, affordability checks, and `SELECTED` / `SHORT` badges were left intact.
- Removed the separate liaison/detail rows so each favor card now communicates the same information in a tighter two-line structure.
- Verified with `npm.cmd run build`.
