# 2026-04-27 2248 Menu Mode Button Stack

## TL;DR
- What changed: Moved the main-menu mode toggle into a vertical stack so `CAMPAIGN` sits above `ARCADE`.
- Why: The user wanted the campaign option visually prioritized above the arcade option on the main menu.
- What didn't work: No browser playtest yet, so this is build-verified only.
- Next: Check the main menu on narrow and desktop layouts to make sure the taller mode stack still leaves the leaderboard area feeling balanced.

---

## Full notes

- Repositioned the two mode tabs to share the same center X and use separate Y positions, with `CAMPAIGN` on the first row and `ARCADE` directly below it.
- Kept the `PILOTS` / `CORPS` tabs and the rest of the leaderboard section flowing below the new stacked mode toggle.
- Left the mode selection behavior unchanged; only the visual order and hit-zone positions moved.
- `npm.cmd run build` passes after the layout update.
