# Plan - New Boss and Wormhole Pocket
_Created: 2026-04-30 1240_

## Goal
Add two gameplay elements built on existing systems:
1. A second boss that joins the Regent gunship in the late-game roster.
2. A "wormhole" that teleports the run into a high-density asteroid pocket map — palette-swapped, no globe, no enemies, no beams, but lots of points and an exit opportunity.

Both must reuse existing entities (`DrifterHazard`, `EnemyShip`, `NPCShip`, `BeamHazard`, `SalvageDebris`, `BombPickup`, `ShieldPickup`, `ExitGate`, `GeoSphere`) and stay inside the Phase / DifficultySystem flow. No new backend, no new scene.

---

## Part 1 — New boss

### Constraint
Phase 10 already spawns `GunshipBoss` (`DifficultySystem.bossEnabled` from [phaseConfig.ts:60](src/game/data/phaseConfig.ts#L60)). New boss must not collide with that. Two slot options:
- **Slot A:** Phase 13+ as a second-tier boss after the gunship is killed.
- **Slot B:** Phase 10 alternates randomly between gunship and new boss, so each phase-10 run feels different.

Recommend **Slot B**. Replays vary, no new pacing curve to author, boss kill still releases debris field same as gunship.

### Concept options (pick one)

#### Option 1 — "Slag Hauler" (asteroid mothership)
Big slow rectangular hull drifts diagonally across arena center (not edge-locked like gunship). Body is a multi-segment chain of giant `DrifterHazard`-style polygons welded together. Each segment is a destroyable mining node with its own HP bar. Periodically the hauler **vents asteroid waves** from its flanks — actual `DrifterHazard` instances spawned at the segment positions. While alive, mining segments give massive points but also accelerate wave spawns (risk/reward).

When all segments are mined out, the core (a `SalvageDebris`-style wreck) is exposed — fly through it twice without dying to detonate, dropping a debris field + a guaranteed bomb pickup.

**Why this fits:** reuses asteroid geometry, mining HP system ([SALVAGE_MAX_HP, DRIFTER_MAX_HP](src/game/data/tuning.ts#L49-L50)), and the gunship's "destroy-all-then-breach-core" structure. No new movement code (linear drift like a giant SalvageDebris). The mining-zone visuals already exist.

#### Option 2 — "Wrangler" (NPC corral boss)
A larger hostile cousin of the existing `EnemyShip` that spawns waves of enemies and tethers them with visible chain links. The Wrangler itself is invulnerable until the player kills the tethered enemies (existing shield-ram). Each killed enemy weakens the tether glow. When all tethers are cut, the Wrangler's unshielded body becomes a one-hit shield ram target.

**Why this fits:** reuses `EnemyShip` spawn logic, no new collision math. Tether is just a thin line draw between transforms.

#### Option 3 — "Beam Lattice" (stationary central pylon)
A central pylon parks in the middle of the arena. It rotates slowly and projects 3-6 inward-firing `BeamHazard`-style beams that sweep around it (like a clock hand). Player must destroy each beam emitter via shield ram — already the gunship gun pattern, just rotated 90° and centered. While alive, the lattice grants a steady salvage points multiplier as long as the player is in its outer ring (so it pulls the player into beam range).

**Why this fits:** reuses gunship gun/beam state machine almost verbatim. The "salvage multiplier in danger zone" is the strongest design hook — reframes the boss as a salvage source.

### Recommendation
**Option 1 (Slag Hauler)** — most distinct from the gunship, reuses asteroid mining (a mechanic that's currently underused at high phases since beams obliterate everything), and naturally drops huge points to reward late-phase risk.

### Implementation sketch (assumes Option 1)
- New entity `src/game/entities/SlagHauler.ts` modeled on `GunshipBoss.ts`. Public surface mirrors gunship: `update`, `getStatusLabel`, `getStatusColor`, `checkBeamHit` (returns false — no beams), `getCollidingGunIndex` → `getCollidingSegmentIndex`, `destroySegment`, `isCoreExposed`, `updateCoreBreach`, `checkCoreContact`, `getCenter`, `destroy`, `active`.
- Tuning block in [tuning.ts](src/game/data/tuning.ts) — segment count (4), segment HP, segment mining points, vent spawn cadence, vent asteroid size scale, body drift speed, core breach distances.
- `DifficultySystem` learns about `SlagHauler` alongside `GunshipBoss`. Add a generic `getBoss(): GunshipBoss | SlagHauler | null` discriminated union, or — cleaner — extract a `BossEntity` interface both boss classes implement so the scene doesn't switch on type.
- Phase 10 spawn picks gunship or hauler 50/50 (or alternates if same phase reached on a retry).
- `GameScene` treats hauler segment ram identically to gunship gun ram (consume shield, drop bonus, redraw status text). Already wired through `getBossGunCollisionIndex` / `destroyBossGun` — those just need to forward to whichever boss is active.
- Wave vents: hauler emits new `DrifterHazard` instances directly into the existing asteroid pool through `DifficultySystem.spawnDrifterAt(x, y, sizeScale)`. No new pool needed.
- Regent and Slick lines for the new boss in [regentLines.ts](src/game/data/regentLines.ts) / [slickLines.ts](src/game/data/slickLines.ts) with new keys (`haulerEnter`, `haulerCoreExposed`, `haulerDestroyed`).
- Build verifies + a 2-window check that gunship still works.

---

## Part 2 — Wormhole pocket

### Concept
A wormhole pickup occasionally drifts in (rare, telegraphed). Collecting it doesn't end the run — it **transitions the active arena into a pocket variant** for a fixed duration (~45-60s). During the pocket:
- `GeoSphere` (corp globe backdrop) hides.
- Palette swaps to a wild non-rotation themed look (e.g., a unique `pocket` palette: deep magenta bg, cyan-white asteroids, gold salvage). Reuses [setPalette()](src/game/constants.ts) machinery — define a new entry in `PALETTES`. The pocket palette is **not** in `PALETTE_ORDER` so the menu cycle never lands on it — only the wormhole effect applies it.
- Enemy and beam spawning suspended (`enemyEnabled = false`, `beamEnabled = false` while in pocket).
- Asteroid density doubled or tripled (override `maxConcurrentDrifters` and `hazardSpawnRate`). Bias size pool toward giants.
- Salvage point multiplier ×2-3 while in pocket. Bonus pickups drop more frequently.
- Exit gates appear on a **shorter cycle** (e.g., every 15s instead of 30s) and are the only way back to the normal arena. Reaching one early returns the run to the normal arena at the same phase but **does not bank** — the wormhole is a points side-track, not a free extract.
- If the pocket timer expires before the player reaches a gate, run survives and arena returns to normal automatically.

### Why this works in the current shape
- Palette swap is a single function call.
- `GeoSphere` already has `setVisible` / depth control for spectate — reuse for pocket.
- All hazard spawning routes through `DifficultySystem`, so a "pocket override" is a temporary phase config layer.
- Exit gate code already supports custom intervals.
- No new scene — same `GameScene`, same systems. The transition is just (a) palette + (b) phase config override + (c) optional starfield tint shift.

### Open design choices to resolve before code
1. **Wormhole pickup rarity/source.** Drop from rare salvage (~5%)? Random independent spawn after phase 5? Recommend rare salvage drop — gives mining a new payoff.
2. **Re-entry policy.** Can the player enter another wormhole inside the pocket? Recommend no — collected during pocket is consumed but no-op.
3. **Death in pocket.** Does player retain wormhole-earned points if they extract via the pocket gate? Recommend: pocket gate banks normally; pocket points are real unbanked credits like everything else. Death loses them like any other death.
4. **Pocket asteroid composition.** All inert (no mining ring) for pure dodge density, or all mineable for a pure-points playground? Recommend a mix biased toward mineable so the "lots of points" promise reads.
5. **Audio.** Reuse existing tracks, or detune/pitch-shift the layered music while in pocket? Recommend a one-track override (e.g., `Synth 3` solo) to make it feel different without new audio.

### Implementation sketch
- Tuning block: `WORMHOLE_*` (pickup radius, pickup lifetime, pocket duration, pocket gate interval, pocket salvage multiplier, pocket asteroid density multiplier, pocket size pool override).
- `WormholePickup` entity (clone of `BombPickup` with a swirling-ring draw).
- `PocketModeSystem` (small system or method on `DifficultySystem`) tracks `isInPocket` + remaining time + saved pre-pocket state. Public methods `enterPocket()`, `exitPocket()`, `getActivePhaseConfig()` — when in pocket, returns a derived config with `enemyEnabled=false`, `beamEnabled=false`, multiplied caps, etc.
- `GameScene.enterPocket()` snapshots current palette, calls `setPalette('pocket')`, hides GeoSphere, force-clears active enemies/beams (existing board-wipe debris path), starts pocket timer, switches music layer.
- Pocket exit gate: adjust `ExtractionSystem` to accept an alternate interval/duration during pocket. On player reaching a pocket gate, call `exitPocket()`, restore previous palette, restore GeoSphere, and resume normal flow at the previous phase **without** banking. Normal-arena gates stay as-is (still bank).
- `Hud.ts` adds a pocket countdown indicator + pocket-tinted score color.

---

## Phasing

Two independent features. Recommend shipping in this order:

1. **Boss interface refactor** — extract a `BossEntity` interface so a second boss is mechanically possible. Tiny, low risk, lands first.
2. **Slag Hauler boss** (Part 1, Option 1).
3. **Wormhole pocket** (Part 2). The riskier change because it touches palette, GeoSphere, hazard suspension, and gate cadence simultaneously.

Each step builds clean and is playable on its own. Don't combine into one giant change.

---

## Out of scope
- New scene file or cinematic transition for either feature.
- New backend / leaderboard fields.
- New art assets — both features rely on existing graphics primitives.
- Versus-mode mirroring for new boss or pocket. Versus already does not mirror gunship; same applies here. Note in known issues.
- Mobile constrained-render adjustments. If the pocket palette or hauler vent count tanks framerate on phones, address in a follow-up.

## Risks
- Pocket palette + double asteroid count may stutter on constrained mobile (the 2026-04-29 render-profile work already cuts vector load — pocket density could push it back over the line).
- A second boss needs a confidence pass on the existing "boss kill = debris field" path — that path currently assumes gunship geometry.
- Wormhole pickup rarity must be tuned so it doesn't land on phase 9-10 and conflict with the boss spawn slot.

## Verification
1. `npm.cmd run build`
2. `npm.cmd run dev`
3. Boss: debug-spawn flag for hauler, verify segment ram, vent waves, core breach, debris field.
4. Pocket: debug-spawn for the wormhole pickup, verify palette swap, GeoSphere hide, asteroid density change, pocket gate cycle, pocket exit, palette restore.
5. Two-window versus check after each step — confirm versus still works.
