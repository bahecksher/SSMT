# State
_Last updated: 2026-04-28 0324_

## Current focus
Phone startup latency. Boot now stays on a minimal critical path: the game only blocks on menu + early-game music, no longer waits on webfont readiness before showing the menu, and the forced boot hold has been cut again to `100ms` so the boot screen is barely more than a transition flash.

## What's working
- `src/game/scenes/BootScene.ts`: boot still shows the existing hologram loading presentation, but the mandatory hold is now just `100ms` instead of a long wait, and the boot-to-menu handoff no longer blocks on font readiness.
- `src/game/systems/MusicSystem.ts`: boot-time music preload is trimmed to `menuSynth`, `bassOne`, and `drumsTwo`; `drumsThree`, `bassThree`, and `gameSynth` now warm after the menu appears instead of blocking first paint.
- `src/game/systems/MusicSystem.ts`: later-loaded gameplay stems start at the current gameplay reference stem's delayed seek position, so late loading should preserve beat alignment instead of reintroducing the old off-beat phase 3→4 crossfade.
- `src/game/scenes/MenuScene.ts`, `src/game/scenes/MissionSelectScene.ts`, and `src/game/scenes/GameScene.ts`: existing `warmMusicCache(this)` calls now do useful background work again because `MID_GAME_TRACKS` is populated.
- `npm.cmd run build`: passes after the latest boot-hold trim.

## In progress
- Cold-refresh browser playtest on an actual phone to measure perceived startup improvement from the smaller boot path.
- Music playtest focused on the menu unlock path and the phase 3→4 transition, since this pass intentionally reintroduced deferred gameplay-stem loading with a new alignment strategy.
- Manual Supabase SQL migration for `mode` / `company_id` columns is still pending.

## Known issues
- **Supabase migration required**: `scores` / `losses` still need nullable `mode` columns, and corporation-tagged rows still need nullable `company_id` columns server-side. Until then, write calls strip unsupported fields and arcade leaderboard reads fall back to legacy mixed rows.
- The new late-load beat-alignment path is build-verified only. It still needs real browser/phone validation, especially on Safari and lower-end Android devices.
- Soft respawn on death keeps rep-flux income accumulators across lives, so pre-death mining/salvage income can still count toward RECLAIM/DEEPCORE rep at run end.
- Rep-flux tuning values are still placeholders: `salvageCreditsPerRep:200`, `miningCreditsPerRep:200`, `ironVeilKillsPerRep:5`, `ironVeilRivalRepCostPerKill:1`, `ironVeilRivalRepCostCapPerRun:3`, `freePortExtractRep:1`, `freePortDeathRep:2`.
- Campaign default lives remain `2`, beam audio is still placeholder, and browser autoplay restrictions still require an initial interaction for music/SFX.

## Next actions
1. Cold-refresh on phone and compare menu-usable time before/after the boot-path slimming and `100ms` boot floor.
2. Playtest menu unlock, MissionSelect, and phase 3→4 audio to confirm the late-load seek alignment stays on-beat.
3. If startup is still too slow on phones, the next likely step is lazy-loading non-menu scenes so Menu can appear before parsing Game/Mission/Tutorial code.

## Active plan
docs/plans/2026-04-28 0318 Plan revision - Startup Loading Performance.md

## How to verify
1. `npm.cmd run build`
2. Hard-refresh the app on phone or mobile emulation and confirm the menu appears almost immediately after boot begins.
3. Confirm boot still shows the loader briefly, but no longer lingers waiting on title-font readiness.
4. After first interaction, confirm menu music starts normally.
5. Enter Mission Select and gameplay, then confirm phase 1/2 music is present and phase 3→4 does not obviously slip off-beat.
6. Confirm late full-track handoff still occurs at phase 7+.

## Recent logs
- docs/log/2026-04-28 0324 Boot Hold Reduced to 100ms.md - cut the remaining forced boot delay down to 100ms while keeping the lighter boot asset path.
- docs/log/2026-04-28 0318 Startup Boot Path Slimdown.md - shrank the boot-time music set, removed the boot font gate, shortened the forced hold, and added seek alignment for late-loaded gameplay stems.
- docs/log/2026-04-28 0301 Tutorial Entry Bomb Flash.md - tutorial intro gate now triggers the same bomb flash/audio accent as the main game start.
- docs/log/2026-04-28 0255 Tutorial Entry Gate Startup.md - tutorial scene now opens with a live-game-style gate intro, and the broken mixed tutorial HUD references were cleaned up so the scene builds again.
- docs/log/2026-04-28 0220 Tutorial Continuous State and Respawn Fallback.md - sections share a continuous arena, soft-respawn replaces hard reset on death, 1.5s respawn-fallback keeps required entities alive.
