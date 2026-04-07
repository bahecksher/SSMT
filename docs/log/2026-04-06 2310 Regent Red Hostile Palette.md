# 2026-04-06 2310 Regent Red Hostile Palette

## TL;DR
- What changed: Swapped the default blue palette's hostile gameplay lane from orange to the old NPC / Regent red family.
- Why: The orange enemy tone was reading too far away from the Regent identity the phase 10 boss is meant to represent.
- What didn't work: I only applied this color correction to the default blue palette in this pass; alternate palettes still keep their current enemy colors.
- Next: Playtest phase 10 on the default palette and decide whether the Regent-style red should become the hostile standard across all palettes.

---

## Full notes

- Updated `src/game/constants.ts` so the blue palette's `ENEMY` color now matches the old NPC / Regent red.
- Nudged the blue palette's `BEAM` accent toward the same red family so Regent comm styling stays aligned with the gameplay hostile lane.
- Verified with `npm.cmd run build`.
