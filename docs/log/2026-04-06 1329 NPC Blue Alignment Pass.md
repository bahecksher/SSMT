# 2026-04-06 1329 NPC Blue Alignment Pass

## TL;DR
- What changed: In the blue palette, NPC ships now use the same blue as the player.
- Why: The user wanted the NPCs to align to the player blue instead of keeping the old yellow accent color.
- What didn't work: Nothing blocked implementation.
- Next: Playtest the blue palette in motion and decide whether the NPCs should stay fully merged with player blue or move to a slightly offset friendly-blue if readability needs separation.

---

## Full notes

- Updated the `blue` palette in `src/game/constants.ts` so `NPC` matches `PLAYER`.
- Verified with `npm.cmd run build`.
- This session also already has the Reclaim salvage-green company color swap applied in `src/game/data/companyData.ts`; the project state now reflects that change even though the previous turn was interrupted before docs were written.
