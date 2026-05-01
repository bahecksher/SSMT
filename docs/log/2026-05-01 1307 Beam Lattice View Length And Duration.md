# 2026-05-01 1307 Beam Lattice View Length And Duration

## TL;DR
- What changed: Beam Lattice rays now extend to the visible view edge, with a 48px overshoot, and the fire window is now 8s.
- Why: The previous arena-boundary target still looked short because the view extends beyond the inset arena.
- What didn't work: No live browser boss run was performed in this pass.
- Next: Spawn Beam Lattice with the debug phase jump and confirm rays reach past the view edge throughout rotation.

---

## Full notes
- Replaced `BEAM_LATTICE_BOUNDARY_OVERSHOOT` with `BEAM_LATTICE_VIEW_OVERSHOOT`.
- `BeamLatticeBoss.getBeamSegment()` now uses `layout.gameWidth` / `layout.gameHeight` instead of arena bounds.
- Increased `BEAM_LATTICE_FIRE_MS` from 5,000 to 8,000.
- `npm.cmd run build` passes.
