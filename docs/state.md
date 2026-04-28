# State
_Last updated: 2026-04-28 0301_

## Current focus
Tutorial Arena polish. The tutorial now uses the 5-section continuous walkthrough (`move`, `score`, `danger`, `shield`, `extract`) with Slick comms, edge-spawned teaching targets, soft respawns, and a live-game-style gate intro that now also fires the same bomb flash/audio accent as the main run start.

## What's working
- `src/game/scenes/TutorialArenaScene.ts`: tutorial launch now begins with the same opening gate behavior as the main game, with no countdown text. The player spawns inside a closing gate, input stays locked during the preview, and section 1 only begins once that intro completes.
- `src/game/scenes/TutorialArenaScene.ts`: when that opening gate completes, the tutorial now fires the same bomb SFX + white flash/shake effect used at the start of a regular run, without pulling in the live scene's board-clearing behavior.
- `src/game/scenes/TutorialArenaScene.ts`: the 5 tutorial sections still run as one continuous arena state with respawn-fallback support instead of hard-resetting between advances or deaths.
- `src/game/scenes/TutorialArenaScene.ts`: the compact tutorial HUD is wired back up cleanly with credits, shield state, current step, and short objective text, replacing the stale half-removed text references that had broken the build.
- `npm.cmd run build`: passes after the tutorial startup flash change.

## In progress
- Browser playtest of the tutorial opening: does the gate-only intro plus bomb flash feel like the live run start without making `HOW TO PLAY` feel sluggish.
- Browser playtest of the 5-section flow overall: pacing, Slick clarity, and whether the top objective line plus bottom comm panel stay readable on smaller screens.
- Manual Supabase SQL migration for `mode` / `company_id` columns is still pending.

## Known issues
- **Supabase migration required**: `scores` / `losses` still need nullable `mode` columns, and corporation-tagged rows still need nullable `company_id` columns server-side. Until then, write calls strip unsupported fields and arcade leaderboard reads fall back to legacy mixed rows.
- Soft respawn on death keeps rep-flux income accumulators across lives, so pre-death mining/salvage income can still count toward RECLAIM/DEEPCORE rep at run end.
- Rep-flux tuning values are still placeholders: `salvageCreditsPerRep:200`, `miningCreditsPerRep:200`, `ironVeilKillsPerRep:5`, `ironVeilRivalRepCostPerKill:1`, `ironVeilRivalRepCostCapPerRun:3`, `freePortExtractRep:1`, `freePortDeathRep:2`.
- Campaign default lives remain `2`, beam audio is still placeholder, and browser autoplay restrictions still require an initial interaction for music/SFX.
- The new tutorial drops the old "live fire endless wave" finale. If the user wants survival back, it would need to be re-added as a sixth optional section.

## Next actions
1. Browser-playtest the tutorial scene launch and confirm the gate intro + bomb flash feel like the live run opening without making `HOW TO PLAY` feel sluggish.
2. Browser-playtest all five tutorial sections and tune any threshold or Slick line that still feels confusing or too slow.
3. Browser-playtest the SHIELDS section's two-phase pickup+impact flow, especially that the second shield + NPC spawn cleanly after the first impact.

## Active plan
docs/plans/2026-04-28 0206 Plan - Tutorial Arena Rework.md

## How to verify
1. `npm.cmd run build`
2. Open `HOW TO PLAY` from the main menu and confirm it jumps straight into `TUTORIAL ARENA`.
3. Confirm the tutorial opens with the player inside a closing gate, no countdown text appears, input is locked during the gate preview, and the same bomb flash/audio used by the main run start fires when the intro gate completes.
4. STEP 1 // MOVE: confirm Slick fires an opener once the flash resolves, the objective text updates, and after enough movement + ~4s you advance with a Slick completion line.
5. STEP 2 // SCORE: confirm a salvage ring AND a mining ring spawn together, you must touch both AND carry at least 30c, then Slick confirms and advances.
6. STEP 3 // DANGERS: confirm a moving drifter and a single hunter spawn with NO shield, surviving ~7.5s advances, dying soft-respawns you and resets the section timer with a Slick reset line.
7. STEP 4 // SHIELDS: confirm a shield spawns, ramming the drifter while shielded breaks the shield AND triggers a second shield + NPC spawn, then bumping the NPC while shielded advances.
8. STEP 5 // EXTRACT: confirm carry credits are pre-loaded if low, the gate warms for ~2.2s, Slick announces gate live, and flying through ends the tutorial.
9. Confirm BACK and `Esc` return to the main menu, and `R` restarts only the current section after the tutorial has begun.

## Recent logs
- docs/log/2026-04-28 0301 Tutorial Entry Bomb Flash.md - tutorial intro gate now triggers the same bomb flash/audio accent as the main game start.
- docs/log/2026-04-28 0255 Tutorial Entry Gate Startup.md - tutorial scene now opens with a live-game-style gate intro, and the broken mixed tutorial HUD references were cleaned up so the scene builds again.
- docs/log/2026-04-28 0220 Tutorial Continuous State and Respawn Fallback.md - sections share a continuous arena, soft-respawn replaces hard reset on death, 1.5s respawn-fallback keeps required entities alive.
- docs/log/2026-04-28 0215 Tutorial Edge Spawns.md - tutorial spawns now drift in from arena edges using the same constructors the live game uses.
- docs/log/2026-04-28 0206 Tutorial Arena Rework.md - replaced the 9-step tutorial with 5 sections taught via Slick comms.
