# 2026-04-27 2235 Campaign Menu Leaderboard Hidden

## TL;DR
- What changed: Selecting `CAMPAIGN` on the main menu now hides the leaderboard section entirely.
- Why: The leaderboard should not be shown while campaign mode is selected.
- What didn't work: The first build failed because the visibility helper used a too-generic `GameObject` type; narrowed it to the actual visible UI object types.
- Next: Live-playtest switching between `ARCADE` and `CAMPAIGN` to confirm the section hides and returns cleanly.

---

## Full notes

- `src/game/scenes/MenuScene.ts`
  - Added a small leaderboard-section visibility helper.
  - `CAMPAIGN` now hides leaderboard title, board tabs, status text, rows, and the corp score graph.
  - `loadLeaderboard()` now early-returns in campaign mode so no leaderboard fetch runs there.
- Verification
  - `npm.cmd run build` passed.
