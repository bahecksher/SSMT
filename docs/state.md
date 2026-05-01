# State
_Last updated: 2026-05-01 1322_

## Current focus
Flesh out campaign-mode boss roster. Added two new Phase 10 bosses (Singularity gravity well, Beam Lattice) alongside the existing Regent gunship and Slag Hauler. Singularity now pulls drifters too. Beam Lattice fires on an 8s/10s cycle.

## What's working
- Phase 10 boss spawn now picks 1 of 4 bosses uniformly (Gunship, Hauler, Singularity, Lattice).
- `BossEntity` interface gains optional `getForceField(x,y,delta)` and `getSalvageMultiplier(x,y)` hooks. Existing bosses ignore both.
- Singularity: drifts to arena center, cycles WARNING → PULL (gravity drags player AND drifters; body lethal) → REPULSE (sustained outward acceleration window) → VULNERABLE (4 orbiting cores ramable). Cores persist across cycles. All 4 destroyed → center core breach. Drifters touching the singularity body during PULL are destroyed via the existing boss-beam path.
- Beam Lattice: stationary central pylon with 4 rotating sweep beams on an 8s fire / 10s cooldown cycle. Telegraph (~1.1s) ramps up beams before they go lethal. Beam endpoints now solve against the live viewport and overshoot the view edge slightly. Hardpoints at body perimeter — ram a hardpoint to disable its beam. 2.5× salvage/mining multiplier when player is in the danger ring during the fire window only. `consumeWarningPulse` flashes the overlay at the start of each fire window.
- While a boss is alive, ambient asteroid spawn intervals are multiplied by 2.0 so boss fights keep some asteroid pressure without becoming as crowded.
- After a boss is destroyed, normal gates are suppressed for a 15s grace window, then a forced extract gate opens for 22s. At the same moment, a heavy enemy surge starts and a wormhole-style collapsing boundary begins pushing the player toward extraction.
- Post-boss regular beams are throttled separately: 3.0× longer frequency and burst count 1 during the escape surge.
- Debug invulnerable mode now processes hazard/boss collisions as shielded collisions, so rams still destroy asteroids, enemies, and boss hardpoints without consuming a real shield.
- `SalvageSystem.setBossYieldMult(mult)` applied each frame from `boss.getSalvageMultiplier(player.x, player.y)`.
- Versus / wormhole pocket flow unchanged.
- `npm.cmd run build` passes.

## In progress
- No code left half-done.

## Known issues
- The old `VersusLobbyScene` still exists in the scene list but is no longer entered from the main menu.
- Main menu embedded Versus room UI needs a live compact-mobile visual check.
- Two-window Versus flow needs a quick smoke test (create/join, ready countdown, Mission Select, deploy, spectate, result).
- Death-screen pulsar/repulsor visibility needs a two-window live check.
- Pocket mode is intentionally disabled in versus; no mirror / sync support was added for it.
- Versus-mode mirror does not render any boss (gunship, hauler, singularity, or lattice).
- Repulsor tuning needs a real two-window feel check for radius, arm time, cooldown, and push force.
- Manual Supabase SQL migration for `mode` / `company_id` columns still pending (`docs/sql/2026-04-28 1403 mode and company_id columns.sql`).
- Rep-flux tuning placeholders remain in `tuning.ts`.
- Singularity / Lattice have no Regent or Slick dialogue lines yet — they reuse generic `bossEnter` / `bossCoreExposed` / `bossDestroyed` lines.
- Singularity gravity affects player and drifters. Enemies/NPCs are not pulled (boss phase suppresses their spawn anyway, but post-boss surge enemies could in theory still be in the arena during a final core-breach cycle).
- Singularity body radius (30px) is lethal during PULL via `checkBeamHit`. If shield is up the player just absorbs and shield breaks; no full debris consumption like a beam — verify feel.
- "Singularity" is a placeholder name — user wanted a better name.
- New boss tuning is first-pass and untested in real runs — pull strength, repulse impulse, vulnerable window, and lattice rotation/danger ring radii all need play tuning.
- Beam Lattice danger ring is purely a salvage zone; there are no rare salvage spawns there yet, so the multiplier currently only applies to whatever ambient drifters/salvage drift through.

## Next actions
1. Live-test each new boss via the debug phase jump and tune timings (singularity pull/vulnerable durations, lattice rotation speed).
2. Pick a final name for the Singularity boss and rename constants/labels.
3. Decide whether Singularity gravity should also pull drifters/enemies; if yes, plumb force application through `DifficultySystem.update`.

## Active plan
docs/plans/2026-04-30 1240 Plan - New Boss and Wormhole Pocket.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run dev -- --host 0.0.0.0`
3. Use the debug phase-jump to land on Phase 10 several times until each of the four bosses spawns.
4. Singularity: confirm pull drags the ship inward, body kill on contact during PULL, repulse blowback fires once on transition, 4 cores ramable during VULNERABLE, all 4 destroyed → center core breach.
5. Beam Lattice: confirm beams sweep continuously for 8s and visibly cross to the view edge in every direction, ramming a hardpoint while shield up disables that beam, salvage point text shows ~2.5× while in the danger ring, all 4 beams down → center core breach.
6. During any boss fight, confirm ambient asteroids still spawn but feel less frequent than regular phase-10 asteroid pressure.
7. After destroying a boss, survive the 15s grace window, confirm an extract gate opens with a large enemy surge, and confirm the collapsing boundary damages/kills outside the circle using the wormhole burn rules.
8. With debug invulnerability on, confirm collisions still break asteroids, enemies, and boss hardpoints like shield collisions.

## Recent logs
- docs/log/2026-05-01 1322 Post Boss Beam Throttle And Debug Shield Collisions.md - reduced post-boss beam cadence and made debug invulnerability process shield-style collisions.
- docs/log/2026-05-01 1318 Post Boss Escape Gate.md - added delayed forced extract gate, heavy enemy surge, and collapsing boundary after boss destruction.
- docs/log/2026-05-01 1310 Boss Asteroid Throttle 2x.md - increased boss ambient asteroid spawn interval multiplier to 2.0x.
- docs/log/2026-05-01 1308 Boss Asteroid Spawn Throttle.md - slowed ambient asteroid spawning while a boss is alive.
- docs/log/2026-05-01 1307 Beam Lattice View Length And Duration.md - extended lattice beams to the view edge and lengthened fire windows to 8s.
- docs/log/2026-05-01 1305 Beam Lattice Boundary Beams.md - extended lattice beams to the arena boundary plus a small overshoot.
- docs/log/2026-05-01 1305 Throttle Cross Arena Beams During Boss.md - cross-arena beam frequency 2.2× and burst count 1 while a boss is alive.
- docs/log/2026-05-01 1255 Boss Tuning Pass.md - widened singularity well, slowed pull, lattice cooldown 15s→10s, gunship beam cooldown 1350ms→2400ms.
- docs/log/2026-05-01 1245 Singularity Pulls Drifters And Lattice Cycle.md - extended singularity gravity to drifters, added 5s/15s fire/cooldown to lattice.
- docs/log/2026-05-01 1226 New Bosses Singularity And Beam Lattice.md - added two Phase 10 bosses behind a 4-way spawn split.
- docs/log/2026-05-01 0208 Death Screen Repulsor Visibility.md - promoted spectator repulsor markers above the death-screen mirror.
- docs/log/2026-05-01 0206 Move Versus Countdown.md - moved the embedded Versus countdown down to the bottom action area.
- docs/log/2026-05-01 0205 Remove Versus Bottom Prompt.md - removed the bottom "ROOM SETUP ABOVE" prompt from Versus mode.
- docs/log/2026-05-01 0204 Main Menu Versus Room Setup.md - moved Versus room creation/joining into the main menu and removed the placeholder no-leaderboard text.
