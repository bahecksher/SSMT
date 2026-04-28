# 2026-04-28 0220 Tutorial Continuous State and Respawn Fallback

## TL;DR
- What changed: tutorial sections now run as a continuous arena state — advancing between sections no longer clears actors or respawns the player. Player deaths during DANGER / SHIELD use a soft-respawn (visual death, short delay, respawn at the safest open point) that resets only the affected section's dwell timer instead of nuking the arena. Each section also has a respawn-fallback loop that polls every 1.5s and re-spawns required entities (salvage, asteroid, drifter, hunter, shield, NPC) from the arena edges if they've drifted off or been destroyed before the lesson completed.
- Why: user feedback that the tutorial felt like a posed diorama with hard resets between steps. Continuous arena state keeps the live-op feel; the respawn fallback prevents the player from getting stuck if a required entity drifts off-screen before they touch it.
- What didn't work: an earlier draft used `clearActors()` between every section transition, which is what caused the diorama feel in the first place. Replaced that with a split between `enterSection(index)` (no clear, used by advances + initial entry) and `hardRestartSection(index)` (clears + respawns, used only by RESET STEP / R key / RESTART TUTORIAL overlay button).
- Next: browser playtest to confirm respawn-fallback cadence (1500ms) feels reactive but not spammy, and that the soft-respawn safe-point picker actually keeps the player away from active hazards.

---

## Full notes

### Files changed
- `src/game/scenes/TutorialArenaScene.ts`
  - Split `startSection` into `enterSection(index)` (no clear, no player respawn — used by initial entry and `advanceSection`) and `hardRestartSection(index)` (clear + respawn — used by RESET STEP / R / RESTART TUTORIAL).
  - Added `softRespawnPlayer(speakKey?)` — visual death + sfx + delayed respawn at `findSafeRespawnPoint(layout)`. Resets `sectionTime`, `nudgeFired`, `scoreReadyTime` so the time-based gating restarts; leaves all arena entities, banked credits, and section progress flags (`salvageTouched`, `miningTouched`, `shieldPhase`) intact.
  - Added `findSafeRespawnPoint(layout)` — picks the candidate point (4 fixed positions) farthest from any active enemy or non-mineable drifter.
  - Added `runRespawnFallback(delta)` — polls every 1500ms. Per section, checks for required entities and respawns from edge if missing:
    - SCORE: salvage debris (if `!salvageTouched`), mineable asteroid (if `!miningTouched`).
    - DANGER: non-mineable drifter and enemy hunter.
    - SHIELD: shield (if phase is `awaitPickup1` or `awaitPickup2`), drifter (if phase is `awaitDrifter`), NPC (if phase is `awaitNpc`).
  - Collision handlers (`handlePlayerNpcCollisions`, `handlePlayerHazardCollisions`) now call `softRespawnPlayer('tutDangerReset')` instead of the old `restartCurrentSection`. The hard-clear path is gone from the failure flow.
  - RESET STEP button + R key now call `requestHardRestart()` which death-animates then `hardRestartSection(currentIndex)`.
  - RESTART TUTORIAL overlay button calls `hardRestartSection(0)` after resetting `scoreSystem`.
  - Wrapped the `extract` case in `enterSection` in `{ }` to keep `const layout` block-scoped (avoids no-case-declarations).
  - Added `playerSoftDown` flag and `respawnCheckTimer` accumulator to scene state.

### What works
- `npm run build` clean.
- Section advance is now seamless: lingering salvage / drifters / NPCs from a prior section keep drifting; the new section just adds its own spawns on top.
- Soft-respawn keeps the DANGER / SHIELD survive timer honest (it resets `sectionTime`) without erasing the arena.
- Respawn fallback handles the worst case where every required entity exits the arena before the player engages — they'll see a fresh entity drift in within 1.5s.

### What is still stubbed
- `findSafeRespawnPoint` only considers 4 fixed candidate points. If all four are occupied by hazards (rare), the player respawns into one anyway. Acceptable for tutorial.
- Respawn-fallback cadence is a fixed 1500ms — first-pass value, may need tuning.
- Slick line copy unchanged.

### Risks / follow-ups
- Lingering tutorial entities can clutter later sections. Example: salvage from SCORE may still be drifting during DANGER, and the player can hide near it for safety. Acceptable tradeoff for the continuous-state feel; can add per-section despawns later if playtest shows it.
- Respawn fallback uses a generous 80px margin around the arena bounds for the in-arena check. An entity that's just left the visible field but is still tracked won't trigger a respawn yet — by design, but watch for stalls.
- If the player runs DANGER death repeatedly without ever advancing, the enemy/drifter pool can grow if respawn-fallback triggers right before the soft-respawn check inhibits it. The fallback gates on `playerSoftDown`, so spam should be limited; still worth watching in playtest.
