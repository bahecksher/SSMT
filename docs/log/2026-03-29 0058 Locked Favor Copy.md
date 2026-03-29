# 2026-03-29 0058 Locked Favor Copy

## TL;DR
- What changed: removed the extra `LOCKED` wording from the locked favor line on MissionSelect, leaving just the favor label.
- Why: the locked-state line was carrying redundant wording and felt heavier than needed.
- What didn't work: nothing blocked this pass.
- Next: keep validating MissionSelect text density on a short phone viewport.

---

## Full notes

- Updated `MissionSelectScene` so locked favor cards no longer render `LOCKED // ...` in the offer line.
- The locked offer line now shows only the favor label itself.
- `state.md` was rewritten and this session log was added per project process.
