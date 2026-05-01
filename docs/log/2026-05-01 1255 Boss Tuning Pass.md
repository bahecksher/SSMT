# 2026-05-01 1255 Boss Tuning Pass

## TL;DR
- What changed: Singularity gravity well wider but slower. Beam Lattice cooldown 15s → 10s. Gunship per-gun beam cooldown 1350ms → 2400ms.
- Why: User feel pass — pull radius too small, pull too aggressive, lattice cooldown too long, gunship lasers too dense across the boss fight.
- What didn't work: n/a, single-file tuning pass.
- Next: Live test all four bosses end-to-end.

---

## Full notes

### Tuning deltas in `src/game/data/tuning.ts`

Singularity:
- `SINGULARITY_PULL_RADIUS` 360 → 480
- `SINGULARITY_PULL_ACCEL` 540 → 380 (px/s² at the edge of the pull radius; falloff still 0.55 + 0.85×proximity)
- `SINGULARITY_REPULSE_RADIUS` 480 → 600
- `SINGULARITY_REPULSE_ACCEL` 1100 → 850

Beam Lattice:
- `BEAM_LATTICE_COOLDOWN_MS` 15000 → 10000

Gunship:
- `GUNSHIP_BOSS_BEAM_COOLDOWN_DURATION` 1350 → 2400

### Effective changes
- Singularity well now reaches roughly 30% deeper into the arena before the gravity kicks in, but the inward acceleration peak drops from ~1000 px/s² near the core to ~700 px/s². Repulse window (700ms) max velocity gain at core falls from ~1500 px/s to ~1200 px/s.
- Lattice cycle: 5s fire + 10s cooldown = 15s period (was 20s). Player gets a fire window every 15s instead of 20s. Fire window itself unchanged.
- Gunship per-gun beam cycle: 1150 + 750 + 2400 = 4300ms (was 3250ms). ~32% slower per-gun fire rate. Stagger between the 5 guns unchanged at `GUNSHIP_BOSS_BEAM_STAGGER_MS = 260`, so spread across the cycle the player-facing density drops proportionally.

### Risks
- Slower gunship cooldown means more dead-air during the boss; if it now feels too soft, bring cooldown back toward 2000ms.
- Wider singularity pull radius now starts very close to the arena walls on small viewports — drifters can be pulled across the arena in one cycle. If asteroids stop respawning fast enough during PULL, revisit.
