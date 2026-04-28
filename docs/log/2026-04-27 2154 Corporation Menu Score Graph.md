# 2026-04-27 2154 Corporation Menu Score Graph

## TL;DR
- What changed: Added a circular corporation score-share graph to the main menu's `CORPS` board, with a red spinning Tortuga globe inside the chart.
- Why: The corp leaderboard benefits from a quick visual read of relative total score share, and the globe gives the menu a stronger Tortuga identity.
- What didn't work: Nothing broke in build, but the chart has only been build-verified so far and still needs a live spacing/readability pass in-browser.
- Next: Playtest the `CORPS` board on narrow and desktop layouts and tune the graph/list balance if it feels crowded.

---

## Full notes

- `src/game/ui/CorporationScoreGraph.ts`
  - New donut chart renderer for corporation score share.
  - Center contains a small animated red wireframe-style Tortuga globe.
- `src/game/scenes/MenuScene.ts`
  - The graph is created in `renderCorporationLeaderboard()`, updated during menu `update()`, and cleared when the board reloads or switches away from `CORPS`.
  - Comm-panel positioning now respects the graph bottom as part of the leaderboard footprint.
- Verification
  - `npm.cmd run build` passed.
