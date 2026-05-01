# 2026-05-01 1305 Throttle Cross Arena Beams During Boss

## TL;DR
- What changed: While a boss is alive, the regular phase-driven `BeamHazard` cross-arena beams fire 2.2× less often and bursts drop to 1 beam each.
- Why: User feedback — combined boss pressure + phase-10 beam config was overwhelming.
- What didn't work: n/a, single tuning + a config-derive branch.
- Next: Live test all 4 bosses with the throttled beam cadence.

---

## Full notes

### Files changed
- `src/game/data/tuning.ts` — added `BOSS_BEAM_FREQUENCY_MULT = 2.2` and `BOSS_BEAM_BURST_COUNT = 1`.
- `src/game/systems/DifficultySystem.ts` — `getActiveConfig` now returns a derived config when a boss is alive (and pocket isn't active): `beamFrequency` scaled by `BOSS_BEAM_FREQUENCY_MULT`, `beamBurstCount` overridden to `BOSS_BEAM_BURST_COUNT`. Pocket override path unchanged. Beams remain enabled (the player can still get caught by one), they're just rarer and not stacked into bursts.
- `docs/state.md` — refreshed.

### Effective change
At phase 10:
- Before: `beamFrequency = 5000ms`, `beamBurstCount = 3`, `beamBurstDelay = 350ms` → 3 beams every ~5s.
- After (boss alive): `beamFrequency ≈ 11000ms`, `beamBurstCount = 1` → 1 beam every ~11s.

Once the boss is destroyed, `getBoss()` returns null and `getActiveConfig()` falls through to the unmodified phase config — the post-boss surge keeps the original beam cadence, since by then bosses aren't piling on top of it.

### Risks
- 11s between beams may feel sparse against the gunship in particular (the gunship's own beams are now also slower after the prior tuning pass). If the player goes too long without arena threat, dial `BOSS_BEAM_FREQUENCY_MULT` back toward 1.6.
