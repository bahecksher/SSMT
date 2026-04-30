# 2026-04-29 2110 Arcade Pilot Board More Rows

## TL;DR
- What changed: arcade weekly pilot leaderboard now uses the same compact-friendly font + tight rowHeight pattern as the corp board, and the row cap was lifted from 4/6 to 10. Local helpers replace the global `leaderboardRowHeight` / `leaderboardFontSize` for this view only.
- Why: user said the arcade board was effectively just showing #1 on phone. The previous cap of 4 rows was throttled even further by the row-fit floor, so a tight viewport landed at 1 row.
- What didn't work: nothing — single targeted edit, build green.
- Next: phone playcheck to confirm full top 10 (or as many as fit) renders without crowding the Slick comm.

---

## Full notes

### Files changed
- `src/game/scenes/MenuScene.ts` / `renderLeaderboard`:
  - Local `pilotFontPx = compactMenu ? 11 : 14`, derived `pilotFontSize = readableFontSize(pilotFontPx)`.
  - Local `rowHeight = compactMenu ? 18 : 24`.
  - Row cap raised: `Math.max(1, Math.min(10, Math.floor((bottomUiTop - startY) / rowHeight)))`.
  - Row text now uses `pilotFontSize` instead of the wider `leaderboardFontSize`.

### Verify
1. `npm.cmd run build` — passes.
2. `npm.cmd run dev`, open at iPhone 13 mini-sized viewport (~375x812).
3. Switch to ARCADE → PILOTS. Confirm at least 6-8 rows render (up to the API's 10 returned), each clearly readable.
4. Switch to a desktop viewport. Confirm full 10 rows fit cleanly.
