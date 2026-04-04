# State
_Last updated: 2026-04-03 0140_

## Current focus
Codebase cleanup pass: eliminated dead code, fixed bugs, extracted shared utilities, and consolidated the three comm panel classes into a shared CommPanel base.

## What's working
- CommPanel base class unifies SlickComm, RegentComm, and LiaisonComm — all layout, animation, and panel-drawing logic lives in one place
- Shared `geometry.ts` utility (`rotatePoint`, `colorStr`, `darkenColor`) eliminates duplication across 6+ files
- Shared `linePicker.ts` utility eliminates duplicate line-picker logic in slickLines/regentLines
- Dead code removed: `deathInversionSequence`, `handlePointerDown`, `SHOW_CIRCLE`, unused `ringPulse` field, stale comments
- Bug fixes: DrifterHazard fragment init fields, beam-killed enemy bomb drops, SalvageDebris hoisted rotatePoint, unreachable dead zone branch removed
- Other AI's new files (SfxSystem, portraitPrimitives, MusicSystem) reviewed and clean
- MissionSelectScene local `colorStr` duplicate replaced with shared import
- `npm.cmd run build` passes clean

## In progress
- No blocked work remains from the cleanup pass

## Known issues
- Background simulation (~180 lines) duplicated between MenuScene and MissionSelectScene — candidate for extraction to a shared BackgroundSimulation class
- Settings UI duplicated across MenuScene, MissionSelectScene, and GameScene pause menu — candidate for a shared SettingsPanel component
- Many inline `#${...toString(16).padStart(6, '0')}` calls across GameScene, MenuScene, Hud could use `colorStr()` but this is cosmetic
- Browser autoplay restrictions still require initial player interaction before audio can become audible
- Soundtrack and SFX still need a real feel pass for balance, overlap, and loudness
- Retry after extraction still bypasses MissionSelect
- Beam hazards still span full screen width/height, not clipped to arena
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly
- Supabase `scores` still needs a nullable `company_id` column added server-side

## Next actions
1. Extract shared background simulation from MenuScene/MissionSelectScene
2. Extract shared settings UI component from 3 scenes
3. Resume soundtrack/SFX feel pass

## Active plan
_(none — cleanup pass complete)_

## How to verify
1. Run `npm.cmd run build`
2. Play through menu -> mission select -> gameplay -> extract/death cycle
3. Confirm all three comm panels (Slick, Regent, Liaison) show/hide with correct styling

## Recent logs
- docs/log/2026-04-03 0140 Codebase Cleanup Pass.md — comm panel refactor, dead code removal, bug fixes, utility extraction, other AI review
- docs/log/2026-04-03 0130 Session Wrap-Up.md — wrapped the portrait session for handoff and git closeout
