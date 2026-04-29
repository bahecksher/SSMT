# 2026-04-29 1459 Versus Sabotage Laser Power-Up

## TL;DR
- What changed: Phase D of the new versus plan. Added a versus-only sabotage laser power-up that drops from enemy/NPC kills (8% / 4%), broadcasts a `MATCH_LASER` event to the peer with a random lane, and spawns a telegraphed lethal lane sweep on the receiver. Distinct violet visual, separate from cyan/red palettes.
- Why: Plan called for an exclusive versus power-up so kills feel meaningful for screen-pressure, not just score. Random lane (not seek-ship) per user decision.
- What didn't work: N/A — TypeScript build is green; needs a real two-window playtest to feel-check drop rate, telegraph timing, and lane fairness.
- Next: Phase E — route versus through `MissionSelectScene` with `RunMode.VERSUS` and a briefing-ready sync gate.

---

## Full notes

Plan reference: `docs/plans/2026-04-29 1432 Plan - Versus Mission Select Sabotage Spectate.md`.

### Tuning (data-driven)

Added to `src/game/data/tuning.ts`:

- `VERSUS_LASER_PICKUP_RADIUS = 14`
- `VERSUS_LASER_PICKUP_LIFETIME = 18000`
- `VERSUS_LASER_DROP_CHANCE_ENEMY = 0.08`
- `VERSUS_LASER_DROP_CHANCE_NPC = 0.04`
- `VERSUS_LASER_COLLECTION_DELAY = 1500` (matches bomb / bonus delay)
- `VERSUS_LASER_SEND_COOLDOWN_MS = 5000` (collector self-rate-limit so multiple back-to-back pickups don't spam-send)
- `VERSUS_LASER_WARNING_MS = 900`
- `VERSUS_LASER_LETHAL_MS = 500`
- `VERSUS_LASER_WIDTH = 26`
- `VERSUS_LASER_COLOR = 0xc070ff` (violet, distinct from cyan/red lanes per plan default)

### New entities

- `src/game/entities/VersusLaserPickup.ts` — modeled on `BombPickup`, diamond glyph + horizontal beam graphic in violet, same lifetime/blink/collection-delay pattern.
- `src/game/entities/VersusLaserStrike.ts` — cross-arena horizontal lane sweep (top/middle/bottom = 25%, 50%, 75% of arena height). Same warning → lethal cycle as `BeamHazard` but with versus-tuned timings, distinct color, and a `hits(x, y, r)` method for direct collision checks.

### DifficultySystem changes

`src/game/systems/DifficultySystem.ts`:

- New `versusLaserDropPositions` array + `versusLasersEnabled` flag.
- `setVersusLasersEnabled(boolean)` setter, called once on `setupMultiplayer`.
- `consumeVersusLaserDrops()` follows the existing bomb/bonus consume pattern.
- Three kill paths now roll the new chance when `versusLasersEnabled`: enemy kill (player), enemy kill via beam, enemy kill via boss beam, NPC kill via hazard. Plain rolls — the bonus-drop chance booster does NOT apply (this is a versus weapon, not a loot bonus).
- Reset paths (debug phase reset, boss-defeat cleanup) now also clear the laser drop list.

### NetSystem changes

`src/game/systems/NetSystem.ts`:

- `NET_EVENT.MATCH_LASER` event constant.
- `MatchLaserPayload { lane, t }` — `t` is sender's match-clock ms (used for receiver dedupe).

### GameScene wiring

`src/game/scenes/GameScene.ts`:

- New arrays: `versusLaserPickups`, `versusLaserStrikes`. New `versusLaserLastSendAt` and `versusLaserRecvDedup: Set<number>` for send-cooldown / receive-dedupe.
- `setupMultiplayer` enables laser drops on `DifficultySystem` and registers the `MATCH_LASER` listener with dedupe-by-`t`.
- `spawnPendingDifficultyDrops` consumes the new drop list when `multiplayer` is set.
- Update loop adds two new passes:
  - Pickup update + collection: when the player touches a collectable laser pickup, the pickup is consumed and `fireVersusLaser` runs.
  - Strike update + collision: lethal sweeps check the player. Shield absorbs (matches existing beam-vs-shield contract), no shield = `handleDeath('laser')`.
- `fireVersusLaser` picks a random lane (top/middle/bottom), broadcasts `MATCH_LASER`, and self-rate-limits via `VERSUS_LASER_SEND_COOLDOWN_MS`.
- `spawnIncomingVersusLaser(lane)` instantiates the receiver-side `VersusLaserStrike`.
- Cleanup paths (`clearBoard`, `softRespawnForCampaign`, scene cleanup) destroy laser pickups and strikes alongside the existing pickup arrays.

### Build verification

`npm.cmd run build` is green. Two new modules transformed (the two new entity files).

### Open / out of scope

- Manual aim — random lane only for MVP per plan.
- Multiple held charges — single-shot with cooldown for MVP.
- Ranked / leaderboard tracking of laser kills.
- Visual tint variant (could swap to Regent red later if violet conflicts with custom palettes).

### Risks / follow-up

- Drop rates (8% / 4%) and lethal-window (500ms) are first guesses. May feel too rare or too punishing — needs a two-window feel pass.
- Shield + laser interaction matches generic beam contract (shield absorbs once). User may want a different rule (e.g., shield absorbs but the strike still telegraphs again).
- Receiver dedupe set grows unbounded across a long match. Cleared when scene resets via `versusLaserRecvDedup = new Set()` in `create()`. If matches go past 30 minutes with constant fire this could grow into the thousands of entries — still tiny, fine for now.
- Strikes do NOT damage NPCs/enemies/asteroids on the receiver side. They only target the local player. If we want them to clear NPCs too, that's a quick add — out of scope for MVP.
