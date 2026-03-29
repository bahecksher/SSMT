# 2026-03-29 1950 MissionSelect UI Session Rollup

## TL;DR
- What changed: Consolidated the MissionSelect and related popup visual pass into one session summary covering favor layout, faction color cleanup, typography/spacing tuning, and mining popup color.
- Why: The session evolved through several small UI iterations, and the user wanted the documentation to reflect it as one coherent pass instead of many micro-logs.
- What didn't work: The append-only logging rule in `AGENTS.md` means the earlier micro-logs were not deleted or rewritten; this rollup summarizes them instead.
- Next: Run a real short-phone/device pass on MissionSelect and continue the adaptive music feel pass.

---

## Full notes

This rollup covers the MissionSelect and related visual work previously captured across the micro-logs from `2026-03-29 1912` through `2026-03-29 1942`.

Session outcomes:
- Reworked the favor section from a 2-column grid into a single stacked list
- Normalized faction identity across the cards:
  - company-colored mission card text
  - company-colored favor-card text
  - red `SHORT` / `LOCKED` state text
  - company-colored progress fills
  - mission-matched inactive favor borders
- Swapped Reclaim from green to the existing purple/magenta palette used elsewhere in the game
- Increased favor-card text sizes slightly and retuned vertical spacing for readability
- Raised the bottom favor detail line to clear the progress bar cleanly
- Changed mining floating credit popups from red hazard color to orange mining color

Files changed during the session:
- `src/game/scenes/MissionSelectScene.ts`
- `src/game/data/companyData.ts`
- `src/game/systems/SalvageSystem.ts`
- `docs/state.md`

Verification performed during the session:
- `npm.cmd run build`
