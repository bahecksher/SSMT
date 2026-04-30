# 2026-04-29 2107 Corp Board Full Names and Globe Recolor

## TL;DR
- What changed:
  - Corp donut globe recolored from `COLORS.HAZARD` to `COLORS.NPC` so it matches the background `GeoSphere` color body. Single-line edit in `CorporationScoreGraph.drawGlobe`.
  - Corp leaderboard rows now always show the full company name (`DEEPCORE MINING`, `RECLAIM CO`, `IRONVEIL SEC`, `FREEPORT UNION`) instead of the 3-letter `leaderboardTag` on compact viewports.
  - Donut chart shrinks further on constrained viewports: graphRadius clamp moved from `42-60` to `28-42` on compact (and `48-70` on desktop) so the four full-name rows fit cleanly under it.
  - Row spacing tightened: corp board now uses a fixed local `rowHeight = 18` (compact) / `24` (desktop) and a smaller dedicated font (11 / 14 px before `readableFontSize` scaling), so all four rows fit without crowding the Slick comm.
- Why: user said the previous corp board was "really bad" — short tags hid the corp identity, donut took too much vertical space on phone, and the donut globe color clashed with the background globe.
- What didn't work: nothing — single pass build green.
- Next: live phone playcheck to confirm full names + smaller donut + matching globe color reads cleanly on iPhone 13 mini.

---

## Full notes

### Files changed
- `src/game/ui/CorporationScoreGraph.ts`: `drawGlobe` now sources its base color from `COLORS.NPC` instead of `COLORS.HAZARD`.
- `src/game/scenes/MenuScene.ts` / `renderCorporationLeaderboard`:
  - Removed the compact-vs-desktop label branch — single line format `${i+1}. ${name}  ${score}c` for both.
  - Local `corpFontPx = compactMenu ? 11 : 14`, derived `corpFontSize = readableFontSize(corpFontPx)` for the rows. No longer reuses the larger global `leaderboardFontSize`.
  - Local `rowHeight = compactMenu ? 18 : 24`, replacing the previous derived `Math.max(16, leaderboardRowHeight - 4)`.
  - `graphRadius` clamp tightened: `compactMenu ? 28-42 : 48-70`. Width factor also drops from 0.16 to 0.13 on compact.
  - Row gap below donut shrunk from `(8|12)` to `(6|10)`.

### Verify
1. `npm.cmd run build` — passes.
2. `npm.cmd run dev`, open at iPhone 13 mini-sized viewport (~375x812).
3. Switch leaderboard to ARCADE → CORPS. Confirm:
   - Donut sits flush under the divider line and is visibly smaller than before.
   - Donut globe shares the background `GeoSphere` color, not the hazard tone.
   - All four full corp names render below the donut without overlapping each other or the Slick comm.
4. Switch to a desktop-sized viewport. Confirm donut is roughly its previous size and rows still read cleanly.

### Out of scope
- Did not change `CorporationScoreGraph` slice / debris colors — those still come from each company's `color` / `accent`.
- Did not change `leaderboardFontSize` for the pilot or campaign leaderboards.
