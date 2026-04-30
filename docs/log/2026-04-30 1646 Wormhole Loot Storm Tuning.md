# 2026-04-30 1646 Wormhole Loot Storm Tuning

## TL;DR
- What changed: made wormhole entry clear the board, changed the pocket palette to yellow, dramatically increased pocket asteroid speed/density/mineable odds, added frequent rare salvage and ship-bonus pickups, suppressed pocket shields, and made pocket exit jump to a random later phase.
- Why: the pocket was functionally working, but needed to feel more like a dangerous bonus dimension with lots of mining and point chances.
- What didn't work: no live feel pass yet; the current values are intentionally aggressive.
- Next: play-test phase 5 and phase 9 wormholes to tune density, speed, loot cadence, and forward phase jumps.

---

## Full notes

1. Files created/changed
   - `src/game/constants.ts`
   - `src/game/data/tuning.ts`
   - `src/game/scenes/GameScene.ts`
   - `src/game/systems/DifficultySystem.ts`
   - `docs/state.md`
   - `docs/log/2026-04-30 1646 Wormhole Loot Storm Tuning.md`
2. What works
   - Wormhole entry clears existing hazards/salvage/pickups with a bomb-like flash before pocket mode starts.
   - Pocket palette is now yellow/gold instead of magenta/cyan.
   - Pocket asteroid tuning is much hotter:
     - higher drifter cap
     - faster spawn cadence
     - much faster asteroid movement
     - mineable chance raised heavily
     - size mix shifted toward more numerous playable asteroids instead of only giants
   - Pocket mode spawns frequent rare salvage and credit bonus pickups using the existing `BonusPickup` behavior.
   - Shield drops and normal shield support are suppressed while in the pocket.
   - Pocket exits now advance to a random later phase; phase 9 exits to phase 10.
   - `npm.cmd run build` passes.
   - `npm.cmd run dev -- --host 0.0.0.0` reports Vite ready at `http://localhost:5173/` when run in the foreground.
3. What is still stubbed
   - No special pocket music/audio state yet.
   - No versus support or mirror rendering for wormholes or pocket mode.
   - Loot-storm tuning values are first-pass.
4. Risks or follow-up recommendations
   - The new density and speed may be too intense on compact screens or lower-power devices.
   - Because pocket exits can jump straight into phase 10, phase-10 arrival may need a short transition/comm cue later.
   - Rare salvage and bonus cadence should be tuned after live play so the pocket feels generous without making normal phases irrelevant.
