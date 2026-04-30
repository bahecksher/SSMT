# 2026-04-29 2101 Corp Board Tightening and Campaign Divider Hide

## TL;DR
- What changed:
  - Corp leaderboard rows: rowHeight reduced by 4 (`Math.max(16, this.leaderboardRowHeight - 4)`), so all four corps stack more tightly.
  - Donut chart pulled up against the divider: changed the local offset from `(compactMenu ? 8 : 12)` to `(compactMenu ? 1 : 2)` so the donut sits flush under the line. Compensated row gap below the donut down from `(14|18)` to `(8|12)`.
  - Campaign leaderboard line bug: the divider line drawn under PILOTS / CORPS tabs was a separate `Graphics` not tracked in `leaderboardSectionUi`, so it stayed visible in CAMPAIGN view and cut through the high-score row. Added the divider to `leaderboardSectionUi` so `updateLeaderboardSectionVisibility` hides it when mode != ARCADE.
  - HOW TO PLAY label: previously collapsed to "GUIDE" on compact viewports. User wanted the full label always — `createHowToPlayButton` now always passes `'HOW TO PLAY'`. Width 88-108 + nav font fits the full string at every breakpoint.
- Why: user reported wasted space in the corp board (between rows + above the donut chart), a visible line through campaign high scores, and the unwanted "GUIDE" relabel on small viewports.
- What didn't work: nothing — single targeted edits, build passes.
- Next: phone playcheck to confirm the donut + tighter rows leave room for Slick comm, the campaign view no longer shows the stray divider, and the full "HOW TO PLAY" label still fits without overflowing the corner button.

---

## Full notes

### Files changed
- `src/game/scenes/MenuScene.ts`:
  - `renderCorporationLeaderboard`: tightened row spacing and the gap between the divider and the donut top edge. Row gap below the donut also reduced.
  - `create`: pushed the leaderboard divider graphic into `leaderboardSectionUi` so `updateLeaderboardSectionVisibility` toggles it together with the PILOTS / CORPS tabs.

### Verify
1. `npm.cmd run build` — passes.
2. `npm.cmd run dev`:
   - Open menu, switch to ARCADE → CORPS tab. Confirm the donut chart sits tight under the divider line and the four corp rows are visibly tighter.
   - Switch to CAMPAIGN. Confirm there is no horizontal line cutting through the LOCAL HIGH SCORE row.
   - Switch back to ARCADE → PILOTS. Confirm the divider line is back.
