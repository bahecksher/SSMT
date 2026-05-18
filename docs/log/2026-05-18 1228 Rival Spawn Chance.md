# 2026-05-18 1228 Rival Spawn Chance

## TL;DR
- What changed: Rival spawns now roll by chance from phase 2 through phase 10 instead of starting at phase 4 on a deterministic timer.
- Why: The arena should feel less predictable and rivals should become part of the earlier living-run texture.
- What didn't work: The sandboxed build hit the same Vite temp-file permission issue under `node_modules`; the escalated build passed.
- Next: Playtest the 35% / 18s roll cadence and tune if Redline appears too often or too rarely.

---

## Full notes

Changed rival spawn tuning:
- `RIVAL_SPAWN_PHASE_MIN = 2`
- `RIVAL_SPAWN_PHASE_MAX = 10`
- `RIVAL_SPAWN_INTERVAL_MS = 18_000`
- `RIVAL_SPAWN_CHANCE = 0.35`

Rivals can now remain eligible during the phase-10 boss phase, but fresh rivals do not spawn during the post-boss surge/escape sequence.

`spawnBoss()` no longer clears an active rival through `clearCombatThreats()`, so a rival can persist into phase 10 if already on field.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
