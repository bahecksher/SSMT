# 2026-04-07 0106 Menu Mode Status Wrapping

## TL;DR
- What changed: converted the menu mode helper text below the `CAMPAIGN` / `ARCADE` buttons into a fixed two-line block
- Why: the previous one-line status strings were long enough to clip or crowd the area under the mode buttons
- What didn't work: nothing blocked this pass
- Next: check the menu on smaller screens to see whether any other compact status strings should be broken into fixed multi-line blocks too

---

## Full notes

- Updated `src/game/scenes/MenuScene.ts` so the mode helper text now reads as `WALLET ...` on the first line and the mode summary on the second.
- This keeps both campaign and arcade states in the same fixed-height footprint, which prevents the status copy from colliding with the leaderboard section below.
- Left the rest of the menu layout unchanged so the fix stays tightly scoped to the rendering issue.
- Verified with `npm.cmd run build`.
