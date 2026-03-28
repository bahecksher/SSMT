# 2026-03-28 0044 Phase 7 Polish and Tuning

## TL;DR
- What changed: Beams obliterate all entities, beam width scales aggressively per phase, beams start at phase 5, bombs detonate on pickup (no button), NPC bomb triggers kill player, late-game difficulty ramp, mining circles removed from small asteroids, rare salvage collection radius fixed, pickup inertia matches shields, salvage module generation rewritten, pause menu uses play icon, Regent triggers on all deaths at phase 5+
- Why: Playtest feedback — game needed more late-game pressure, UI cleanup, and consistent physics across pickups
- What didn't work: Salvage-asteroid collision (bounce then break-apart) didn't feel right — removed entirely, salvage now passes through asteroids unaffected
- Next: Playtest the new difficulty curve, consider audio implementation

---

## Full notes

### Beams
- Beams now destroy everything they touch: asteroids (shatter into debris), enemies (drop bonus), NPCs (drop shield/bonus), salvage
- Beam width scales per phase with 1.4x exponential curve starting at phase 5, capped at 120px
- Each beam stores its own width; all collision checks use per-beam value
- Beams fire in rapid-succession bursts at phase 8+ (200-500ms between each beam in a burst)
- Beams now start at phase 5 alongside enemies (was phase 7), frequency starts gentler at 10s

### Bombs
- Bomb button removed entirely — bombs detonate instantly on player collection (board wipe)
- NPC bomb collection triggers board wipe AND kills the player
- Bombs carry full inertia (no friction), matching shield drift
- HUD bomb indicator and playerHasBomb state removed

### Pickups
- Bonus point pickups carry full inertia (removed 0.988 friction damping)
- Bonus drops no longer gated by arena boundary check — can spawn and drift anywhere
- Bombs also carry full inertia, no arena boundary restriction

### Mining
- Small asteroids (radiusScale < 1.5) no longer show mining circles or score as mineable

### Salvage
- Rare salvage collection radius fixed — was 48px due to radiusScale:0.6, now full 80px
- Salvage module generation rewritten: child modules connect flush edge-to-edge at random attachment points along parent edges, perpendicular orientation
- Salvage-asteroid collision removed entirely (bounced, then broke apart, then removed)

### UI
- Pause menu: removed RESUME text/play icon from panel, resume only via top-right button
- Pause button shows ▶ when paused instead of "RESUME" text

### Difficulty
- Phase 5+: beams enabled (was 7), frequency 10s ramping to 2.5s
- Phase 8+: up to 6 concurrent enemies (was 4), beam burst system
- Beam width aggressive curve from phase 5

### Dialogue
- Regent triggers kill taunt on ALL deaths at phase 5+, regardless of cause
