# 2026-04-29 1637 Versus Lobby Menu Backdrop

## TL;DR
- What changed: the versus lobby now uses the same inactive arena backdrop treatment as the main menu: starfield, geo-sphere, drifting debris/asteroids/NPCs, and the same translucent panel feel over the top.
- Why: user wanted the versus menu to visually match the main menu instead of feeling like a flat intermediate screen.
- What didn't work: no manual browser visual pass yet, so this is build-verified only.
- Next: check the lobby on live desktop/mobile sizing and confirm the background continuity feels good when moving menu -> versus -> briefing -> back.

---

## Full notes

Plan reference: `docs/plans/2026-04-29 1432 Plan - Versus Mission Select Sabotage Spectate.md`.

Implemented in `src/game/scenes/VersusLobbyScene.ts`:

- Added the same background simulation pieces already used by `MenuScene` / `MissionSelectScene`:
  - starfield
  - `GeoSphere`
  - drifting `SalvageDebris`
  - drifting `DrifterHazard`
  - roaming `NPCShip`
- Added a menu-style translucent rounded backing panel behind the lobby UI so the text sits over the inactive arena the same way the main menu does.
- Added background update, spawn, cleanup, and handoff helpers so the backdrop behaves like the existing menu/briefing screens instead of being a one-off visual.

Handoff continuity:

- `src/game/scenes/MenuScene.ts` now passes the current inactive arena state into `VersusLobbyScene` when starting versus mode.
- `VersusLobbyScene` now passes its current background state:
  - back to `MenuScene` on `BACK`
  - forward to `MissionSelectScene` on match start

Result:

- Menu -> Versus no longer pops into a fresh empty screen.
- Versus -> BACK no longer resets the whole background presentation abruptly.
- Versus -> MissionSelect keeps the same general inactive arena feel between scenes.

Files changed:

- `src/game/scenes/MenuScene.ts`
- `src/game/scenes/VersusLobbyScene.ts`
- `docs/state.md`
- `docs/log/2026-04-29 1637 Versus Lobby Menu Backdrop.md`

Verification:

- `npm.cmd run build`
