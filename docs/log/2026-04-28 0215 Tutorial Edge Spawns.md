# 2026-04-28 0215 Tutorial Edge Spawns

## TL;DR
- What changed: tutorial spawns (salvage debris, drifter asteroids, NPCs, shields) now drift in from the arena edges using the same default constructors the live game uses, instead of popping into place at fixed coordinates. Gates remain fixed (matches live behavior).
- Why: user feedback that tutorial entities should "come in from the sides like in the normal game" so the tutorial reads like a live op rather than a posed diorama.
- What didn't work: ShieldPickup has no edge-spawn constructor in the live game (shields drop from killed entities). Wrote a `spawnShieldFromEdge` helper that picks a random arena edge and gives the shield an inward velocity.
- Next: browser playtest section pacing now that entities take a moment to drift in. May need to bump `DANGER_SURVIVE_MS` if the hunter takes too long to engage.

---

## Full notes

### Files changed
- `src/game/scenes/TutorialArenaScene.ts`
  - Replaced `spawnTutorialSalvage(x,y)` (used `SalvageDebris.createAt`) with `spawnSalvageFromEdge()` (uses `new SalvageDebris(scene)` — random edge entry).
  - Replaced `spawnTutorialDrifter(x,y,vx,vy,scale,mineable)` (used `DrifterHazard.createFragment`) with `spawnDrifterFromEdge(speed, scale, mineable)` (uses `new DrifterHazard(scene, speed, scale, mineable)` — random edge entry).
  - Replaced `spawnTutorialNpc(x,y,vx,vy)` (used `NPCShip.createAt`) with `spawnNpcFromEdge()` (uses `new NPCShip(scene)` — random edge entry).
  - Replaced `spawnShield(x,y)` with `spawnShieldFromEdge()` — picks a random arena edge, computes an inward angle to center, applies a 40-65px/s velocity to the new `ShieldPickup`.
  - Section spawn calls in `startSection` updated to use the new helpers. Tutorial drifter speeds tuned slow (35-45 px/s) so they read as drift-in rather than charge-in.
  - SHIELD section's phase-2 trigger (after the drifter ram) now spawns the second shield + NPC from edges instead of fixed coordinates near center.

### What works
- `npm run build` clean.
- All five sections still gate advance on the same conditions; only entry behavior changed.
- ExitGate stays fixed at the right side of the arena, matching live game gate behavior.

### What is still stubbed
- Slick line copy unchanged from prior pass.
- No section 6 / endless survival finale.

### Risks / follow-ups
- DANGER section: the hunter and drifter both come in from random edges. If both happen to pick edges far from the player, the 7.5s window may feel uneventful. Watch in playtest; can pin one of them or bump dwell.
- SCORE section: salvage and asteroid drift through the arena — they may exit before the player engages. Section will not advance until both ring types are touched, so the player has to chase, but a stale section needs a re-spawn fallback if they miss both. Add only if playtest shows it.
- SHIELD section: the second shield + NPC also come in from edges. If the NPC enters from the same side as the player and bumps before the player can grab the new shield, that's a section reset on shieldless contact. Acceptable but worth watching.
