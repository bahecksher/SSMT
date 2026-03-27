# 2026-03-26 0132 Gate Timing Shield Drift Beam Volley

## TL;DR
- What changed: Three gameplay tweaks — extraction requires being at gate when it closes, shield pickups drift with salvage, beams fire as 1-3 volleys with red screen flash warning
- Why: User-requested gameplay improvements for feel and thematic consistency (ship firing beams across the field)
- What didn't work: Nothing — clean implementation
- Next: Playtest the new gate timing feel, tune beam volley frequency, continue Phase 6 planning

---

## Full notes

### Exit gate extraction timing
- Previously: touching the gate at any point while open triggered extraction
- Now: extraction only triggers at the exact frame the gate closes, if the player is inside the gate radius at that moment
- Implementation: ExtractionSystem tracks a `closingGate` reference for one frame when a gate deactivates; BankingSystem checks against that closing gate instead of the active gate
- This makes extraction a timing/commitment challenge — you must stay at the gate until it disappears

### Shield pickup drifting
- ShieldPickup now accepts `vx`/`vy` in constructor and moves each frame
- Velocity is copied from the paired SalvageDebris at spawn time via new `driftVx`/`driftVy` readonly properties
- Shield now travels alongside the salvage it spawned near

### Beam volley with warning flash
- DifficultySystem now spawns 1-3 beams per volley instead of one at a time
- A red screen flash (Overlays.beamWarningFlash) fires before each volley — quick 400ms red overlay fade
- Simulates a hostile ship firing a broadside across the arena
