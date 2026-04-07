# 2026-04-06 2316 Brighter Cyan Player

## TL;DR
- What changed: Shifted the default blue palette's player ship color from the older cooler blue to a brighter cyan.
- Why: With asteroids neutralized and hostiles pushed into the Regent red lane, the player can now carry a clearer cyan identity without competing as much with the rest of the board.
- What didn't work: This pass only changes the default blue palette; alternate palettes keep their current player hues.
- Next: Playtest to confirm the brighter cyan feels right against shields, gate blue, and the Slick portrait accents.

---

## Full notes

- Updated `src/game/constants.ts` so the blue palette `PLAYER` and `PLAYER_GLOW` now use `0x49f6ff`.
- This automatically brightens the player ship, player-linked starfield accents, and other UI elements that already follow the shared player color lane.
- Verified with `npm.cmd run build`.
