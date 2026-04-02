# 2026-04-02 1530 Game UI Readability Pass

## TL;DR
- What changed: Increased text sizes across the menu, mission briefing, HUD, pause/results UI, comm panels, and floating credit popups; resized the tightest buttons, sliders, pills, and panels to fit
- Why: Several UI labels and controls were too small to read comfortably
- What didn't work: This session only verified with a production build, not a live device/browser visual pass
- Next: Playcheck the readability pass on phone and desktop, then tune any remaining cramped layouts before returning to music feel work

---

## Full notes

- Added a shared `readableFontSize()` helper in `src/game/constants.ts` and used it across the UI so the size bump stays consistent.
- Kept the terminal-style font direction, but unified gameplay UI that was still using generic `monospace` onto the shared `UI_FONT` stack.
- Enlarged menu and MissionSelect settings controls, the in-run pause button, result buttons, HUD mission pills, and comm panels so the larger labels still fit.
- Gave the pause overlay more vertical room and thickened the settings sliders slightly so the larger text does not make the controls feel cramped.
- Updated floating salvage/mining/reward popups to match the new readability pass.
- `npm.cmd run build` passes.
- This was a small scoped UI task outside the active layered-music plan; the music plan remains the active long-running plan.
