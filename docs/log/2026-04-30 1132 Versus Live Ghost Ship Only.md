# 2026-04-30 1132 Versus Live Ghost Ship Only

## TL;DR
- What changed: restored the opponent ghost ship during active versus gameplay without restoring the full live ghost arena.
- Why: the moving peer ship behind the arena felt good, but the full mirrored arena was too visually busy during play.
- What didn't work: no live two-window visual pass was run in this session.
- Next: verify that only the ghost ship appears during active play and the full ghost arena still appears during death/extract spectate.

---

## Full notes

- Changed the non-spectate mirror update path in `GameScene` so it clears the mirror background/labels and draws only the interpolated peer ship.
- The live ghost ship keeps lightweight visual state: alive triangle, shield ring, or KIA mark.
- Full peer arena details remain gated behind `versusSpectating`.
- `npm.cmd run build` passes.
