# 2026-04-30 1147 Versus Spectate Repulsor Charges

## TL;DR
- What changed: replaced spectator ping markers with delayed repulsor charges that shove nearby arena bodies.
- Why: pinging created visual noise without satisfying gameplay feel; repulsor taps give spectators a clearer and more playful disruption verb.
- What didn't work: no live two-window tuning pass was run in this session.
- Next: test radius, arming delay, cooldown, and push force in a real versus match.

---

## Full notes

- Added `MATCH_REPULSOR` and `MatchRepulsorPayload` to `NetSystem`.
- Removed the old `VersusPingMarker` entity and added `VersusRepulsorCharge`.
- Spectate mirror taps now broadcast repulsor placement and spawn a local visual echo.
- Live receivers spawn an arming charge, then apply radial impulse to the player, asteroids, salvage, NPCs, enemies, and pickups when it detonates.
- Added data-driven repulsor tuning constants in `tuning.ts`.
- Added small impulse helpers on `Player` and `EnemyShip`.
- `npm.cmd run build` passes.
