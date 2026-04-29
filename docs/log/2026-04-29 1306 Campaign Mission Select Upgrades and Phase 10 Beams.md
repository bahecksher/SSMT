# 2026-04-29 1306 Campaign Mission Select Upgrades and Phase 10 Beams

## TL;DR
- What changed: added campaign Mission Select purchases for extra lives and paid start phases, removed arcade reroll credit cost, and let phase 10+ keep spawning cross-arena beams during boss runs.
- Why: the active work was intentionally redirected by the user away from the earlier versus plan, so this session created a new spec/plan and implemented the requested campaign/arcade gameplay changes.
- What didn't work: no live manual browser playtest was completed in this session, so the new UI/readability and boss-plus-beam feel are only build-verified.
- Next: manually play the campaign briefing flow and a phase-10+ boss run to judge clarity and balance.

---

## Full notes

- Wrote `docs/spec/2026-04-29 1254 Spec - Campaign Mission Select Upgrades.md` and `docs/plans/2026-04-29 1254 Plan - Campaign Mission Select Upgrades.md` because this session deliberately diverged from the previously active mirrored-versus plan.
- `MissionSelectScene` now has a campaign-only action strip:
  - `REROLL` still uses the existing paid campaign cost ladder.
  - `+1 LIFE // 10k` spends campaign wallet credits immediately and increments campaign lives.
  - `START PHASE N // COST` cycles phases `1-10`, and the selected phase is charged/applied on deploy.
- Arcade rerolls now stay limited by `MAX_REROLLS` but do not spend or display wallet cost.
- `GameScene` now accepts a `startPhase` handoff for campaign deploys and applies the phase state without marking the run as a debug jump.
- `DifficultySystem` now keeps the regular cross-arena beam hazard alive in phase 10+ even while the gunship boss is active.
- Verification completed:
  - `npm.cmd run build`
- Verification not completed:
  - manual campaign Mission Select purchase pass
  - manual phase 10+ readability/balance pass
