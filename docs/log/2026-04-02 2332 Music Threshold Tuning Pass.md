# 2026-04-02 2332 Music Threshold Tuning Pass

## TL;DR
- What changed: Shifted the adaptive music thresholds so `Bass 1` carries phases 1-2, `Bass 3` + `Synth 3` enter at phase 3, and the full-track handoff begins at phase 5.
- Why: The user wanted the early gameplay arrangement to stay closer to MissionSelect and wanted the escalation to arrive sooner.
- What didn't work: The user referred to `Bass 2`, but there is no matching asset in the repo, so I used `Bass 3`.
- Next: Playcheck the new phase transitions and confirm whether `Bass 3` is the intended bass swap stem.

---

## Full notes

- Updated `src/game/systems/MusicSystem.ts` only; no scene-flow changes were needed for this adjustment.
- Phase mapping is now:
- Phases 1-2: `Drums 3` + `Bass 1`
- Phases 3-4: `Drums 3` + `Bass 3` + `Synth 3`
- Phase 5+: one randomly chosen full track for the remainder of the run
- Verified with `npm.cmd run build`.
