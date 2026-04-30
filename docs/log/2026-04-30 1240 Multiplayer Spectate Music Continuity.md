# 2026-04-30 1240 Multiplayer Spectate Music Continuity

## TL;DR
- What changed: multiplayer death/extract no longer switches to result/menu music immediately.
- Why: the dead/extracted player is still spectating an active versus run, so the gameplay music should continue until the match actually resolves.
- What didn't work: no live two-window audio pass was run in this session.
- Next: verify death spectate, extract spectate, and final versus result music transitions.

---

## Full notes

- `handleDeath()` now skips `setResultMusic()` when `this.multiplayer` is active.
- `handleExtraction()` now skips `setResultMusic()` when `this.multiplayer` is active.
- `renderVersusResult()` now calls `setResultMusic()` when the actual both-player versus result panel renders.
- Solo/non-multiplayer result music behavior remains unchanged.
- `npm.cmd run build` passes.
