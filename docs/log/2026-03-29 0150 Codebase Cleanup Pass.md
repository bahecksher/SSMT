# 2026-03-29 0150 Codebase Cleanup Pass

## TL;DR
- What changed: removed the unused `GameOverScene`, deleted orphaned liaison/tuning helpers, and routed MissionSelect mission saves through shared mission persistence helpers
- Why: the repo had accumulated dead branches and duplicate save logic during rapid UI/economy iteration
- What didn't work: the first broad patch hit text drift in `liaisonLines.ts`, so the cleanup was reapplied in smaller targeted edits
- Next: do a manual sanity pass through menu, briefing, deploy, retry, and menu-return flows on a phone-sized viewport

---

## Full notes

- Added `docs/plans/2026-03-29 0145 Plan - Codebase Cleanup.md` to record the cleanup scope before editing.
- Removed the legacy `GameOverScene` from runtime config and deleted the scene file because current flow already resolves post-run inside `GameScene`.
- Replaced MissionSelect's direct `localStorage.setItem('ssmt_missions', ...)` writes with the shared `saveMissionSelection()` helper in `MissionSystem`.
- Removed stale exported helpers/data that no longer participate in the live game flow:
  - liaison select/deselect dialogue pools
  - unused company rep/deal helper exports and unused data fields
  - unused salvage tuning constants
- Hooked NPC salvage range back to the shared tuning constant so it is no longer a silent magic number.
- Confirmed the cleanup with `npm.cmd run build`.
