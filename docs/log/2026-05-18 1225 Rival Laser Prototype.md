# 2026-05-18 1225 Rival Laser Prototype

## TL;DR
- What changed: Added the first solo rival prototype, Veyra Kade / Redline, with Ironveil comms, a unique ship icon, forward laser attack, shield-ram HP damage, and flee-at-1-HP behavior.
- Why: The rival system now supersedes ship-hardening as the active direction so the arena feels more alive before the story overhaul.
- What didn't work: The first sandboxed build failed because Vite could not write its temp config file under `node_modules`; rerunning the same build outside the sandbox passed.
- Next: Playtest spawn timing/readability, then add the repulse, layered-shield, and black-hole-bomb rival variants.

---

## Full notes

Implemented the first slice of `docs/plans/2026-05-18 1213 Plan - Rival System.md`.

Files added:
- `src/game/data/rivalData.ts`
- `src/game/entities/RivalShip.ts`
- `src/game/ui/RivalComm.ts`

Files changed:
- `src/game/data/tuning.ts`
- `src/game/systems/DifficultySystem.ts`
- `src/game/scenes/GameScene.ts`
- `docs/state.md`

Runtime behavior:
- Rivals are enabled in solo modes and disabled in Versus.
- The first rival starts spawning from phase 4 onward, outside boss and pocket mode.
- Redline hunts the player, telegraphs a forward laser, fires a lethal beam, then recovers before hunting again.
- Shield contact damages the rival; a hit that would reduce the rival below 1 HP triggers flee instead of destruction.
- A fleeing rival stops attacking and escapes off field.
- Rival comms use a company-colored comm panel and interrupt normal gameplay chatter for intro, ability tell, flee, and escape beats.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
