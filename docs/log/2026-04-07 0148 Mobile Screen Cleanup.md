# 2026-04-07 0148 Mobile Screen Cleanup

## TL;DR
- What changed: tightened narrow/short mobile layouts across MenuScene, MissionSelectScene, comm panels, HUD, pause, and result overlays
- Why: iPhone 13 mini-sized screens were crowded, and short mobile viewports could push UI blocks into each other
- What didn't work: this session did not include a real-device Safari capture or hands-on phone smoke test
- Next: test the updated screens on an iPhone-sized viewport and tune any remaining bottom-gutter HUD or overlay edge cases

---

## Full notes

- Added shared viewport helpers in `src/game/layout.ts` so scenes can consistently recognize narrow-width and short-height phone layouts.
- Tightened compact comm panel typography/padding and let the gameplay HUD move `BEST` onto a second row when the primary HUD row gets too wide.
- Reworked Menu spacing so short phones use a smaller title stack, shorter helper copy, fewer leaderboard rows, and safer comm-panel reservation.
- Reworked Mission Select spacing and copy density so stacked mission cards, wallet text, and all four favor cards remain readable on cramped screens.
- Reworked result and pause overlays so short phones get smaller gaps, shorter labels, tighter debug/status blocks, and more compact mission rows.
- This session intentionally diverged from the previously active mining-mission cleanup plan because the user explicitly requested a mobile formatting pass.
- Verified with `npm.cmd run build`.
