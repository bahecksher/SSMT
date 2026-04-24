# 2026-04-24 1140 Gameplay Cleanup Pass

## TL;DR
- What changed: Extended the phase-4 layered music section through phase 6, reset the music clock on result screens so back-to-back runs restart cleanly, retuned the placeholder beam audio into a charge whine plus heavier fire hit, unified shield/points/bomb pickups to the green lane, removed the tiny small-asteroid point drops, raised ship-destruction bonus values, and moved/strengthened gate previews so spawn locations read earlier.
- Why: User asked for a focused cleanup pass around music pacing/reset behavior, laser feel, pickup color consistency, reward tuning, and gate telegraph clarity.
- What didn't work: Beam audio is still a placeholder built from `bomb.mp3`, and this pass did not extend the new beam cue treatment to the phase-10 boss cycle.
- Next: Browser-playtest the new result-screen reset flow and gate readability, then decide whether boss beams should share the new placeholder cue and resume the Tauri/Rust packaging thread.

---

## Full notes

This session intentionally diverged from the active desktop-standalone plan to handle a direct user-requested gameplay/audio cleanup pass. Logging that explicitly so the docs do not silently drift from the current plan file.

### Music progression + reset
- `src/game/systems/MusicSystem.ts`
- Moved the full-track handoff from phase 5 to phase 7 so the phase-4 layered arrangement now carries phases 4, 5, and 6.
- Added a `resetMusicTiming(scene)` helper that stops any currently playing layered/full-track music and clears the running session state without throwing away the cached sound objects.
- `setResultMusic()` now calls that reset helper before bringing up the menu/result mix. That means `DESTROYED` / `EXTRACTED` results become the intentional sync reset point for the next run.

### Beam placeholder audio
- `src/game/systems/SfxSystem.ts`
- Added a dedicated placeholder `beamCharge` SFX entry alongside `beamFire`. Both still point at `audio/bomb.mp3`, but they now have separate source names/base volumes so we can tune them independently until real assets arrive.
- `src/game/entities/BeamHazard.ts`
- Regular beams now play a higher-pitched charge cue when the warning telegraph spawns.
- The warning-to-lethal transition now uses a slower/lower placeholder hit so the laser feels bassier and slightly longer.

### Rewards + pickup color pass
- `src/game/data/tuning.ts`
- Disabled the small-asteroid destroy drop chance entirely (`ASTEROID_DESTROY_DROP_CHANCE = 0`).
- Increased ship-destruction reward values to `ENEMY_BONUS_POINTS = 360` and `NPC_BONUS_POINTS = 210`.
- `src/game/entities/ShieldPickup.ts`
- `src/game/entities/BombPickup.ts`
- `src/game/scenes/GameScene.ts`
- Shield and bomb pickups now use `COLORS.SALVAGE`, matching the bonus-credit pickup. Their board-wipe debris color was updated to match too.

### Gate preview readability
- `src/game/data/tuning.ts`
- Increased `EXIT_GATE_PREVIEW` from `10_000` to `15_000`.
- `src/game/entities/ExitGate.ts`
- Kept the shrinking outer forecast ring, but added a stronger always-visible center ring/fill plus bracket lines so the eventual spawn point reads immediately instead of only becoming obvious late in the preview.

### Verification
- Ran `npm.cmd run build` successfully after the changes.
- Did not run a live browser playtest in this session.
