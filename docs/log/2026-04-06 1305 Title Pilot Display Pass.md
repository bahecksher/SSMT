# 2026-04-06 1305 Title Pilot Display Pass

## TL;DR
- What changed: Replaced the static Slick portrait on the menu title screen with a larger pseudo-3D version of the player craft that slowly spins.
- Why: The user wanted the title screen to feel more tied to the actual pilot/ship identity, with enough depth that the craft still reads when it turns edge-on.
- What didn't work: Nothing blocked implementation; the circular title frame stayed in place so the new hero object could slot into the existing layout cleanly.
- Next: Playtest the menu hero area and decide whether the ship silhouette, spin speed, or frame treatment needs a taste pass.

---

## Full notes

- Added `src/game/ui/TitlePilotDisplay.ts` to render a simple wedge/prism-style hologram ship with perspective projection, face sorting, and a slow continuous spin.
- Updated `src/game/scenes/MenuScene.ts` to remove the title-screen `createSlickPortrait()` usage and replace it with the new title pilot display.
- Increased the title portrait frame size slightly so the enlarged ship has enough room to read.
- Kept the rest of the menu layout intact so the title, callsign, leaderboard, and comm panel keep their existing positions.
- Verified with `npm.cmd run build`.
