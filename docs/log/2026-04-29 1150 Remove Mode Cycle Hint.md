# 2026-04-29 1150 Remove Mode Cycle Hint

## TL;DR
- What changed: Removed the static `TAP TO CYCLE MODES` helper text from the main menu mode selector and tightened the leaderboard header spacing so the chevron-framed mode label stands on its own.
- Why: User wanted the extra hint line gone.
- What didn't work: Nothing blocked the change; only a small layout cleanup was needed after removing the text object.
- Next: Do a quick visual pass in the menu while continuing the pending manual checks for campaign-only company buffs and the two-window versus flow.

---

## Full notes

- Updated `src/game/scenes/MenuScene.ts` to remove the dedicated mode-cycle hint text object.
- Repositioned the leaderboard title to sit directly beneath the mode selector now that the hint row is gone.
- Left the mode selector chevrons (`< MODE >`) intact so the control still reads as interactive.
- Ran `npm.cmd run build` successfully after the change.
- Rewrote `docs/state.md` to reflect the slimmer menu affordance and the latest verification steps.
