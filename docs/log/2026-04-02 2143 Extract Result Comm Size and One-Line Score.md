# 2026-04-02 2143 Extract Result Comm Size and One-Line Score

## TL;DR
- What changed: Made the extracted result screen use a slimmer pinned Slick comm layout and added an auto-fit pass so `CREDITS BANKED: #####` stays on one line
- Why: The user reported the extracted comm panel feeling larger than the destroyed version and asked for the banked-credits line to fit on one row
- What didn't work: No live phone playcheck happened in-session; verification stayed at `npm.cmd run build`
- Next: Check both result states on a real phone-sized viewport and trim further if the extracted comm still feels oversized

---

## Full notes

- This session intentionally diverged from the active layered-music plan to address a direct user-requested results-screen polish issue.
- Updated `src/game/scenes/GameScene.ts` and `src/game/ui/SlickComm.ts`.
- Extraction now pins Slick using a compact result layout instead of the fuller pinned layout used on the destroyed screen.
- Added a small width-fit helper for the extracted score summary so the banked-credits line scales down only when it needs to.
- Verified with `npm.cmd run build`.
