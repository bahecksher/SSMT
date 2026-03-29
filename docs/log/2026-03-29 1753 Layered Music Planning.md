# 2026-03-29 1753 Layered Music Planning

## TL;DR
- What changed: Reviewed the updated project state, traced the current scene and phase flow, and wrote a focused plan for layered music implementation.
- Why: Music layering touches boot, scene transitions, phase progression, and settings, so the work benefits from a clear implementation plan before code changes.
- What didn't work: No audio assets are in the repo yet, so implementation cannot be verified until the synth/drums/bass loops are added.
- Next: Add the music files, build a small music manager, and hook scene/phase transitions to layer volume changes.

---

## Full notes

Pivoted away from the previous cleanup plan because the user requested a new feature area: adaptive music layering. Read `AGENTS.md`, `docs/state.md`, `docs/decisions.md`, the active cleanup plan, and the relevant scene/system files before planning.

Current codebase fit is good for a centralized music manager:
- `BootScene` currently does no asset preload work yet.
- `MenuScene`, `MissionSelectScene`, and `GameScene` already provide clear transition points for baseline music states.
- `GameScene` already has a single phase-advance branch tied to `ExtractionSystem`, which is the right place to trigger music escalation.

Recommended implementation direction is to keep all three stems running in sync and mix them by volume, rather than starting/stopping separate tracks at each transition.
