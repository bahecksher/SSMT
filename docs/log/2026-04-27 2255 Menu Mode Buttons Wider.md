# 2026-04-27 2255 Menu Mode Buttons Wider

## TL;DR
- What changed: Widened the stacked `CAMPAIGN` and `ARCADE` mode buttons on the main menu.
- Why: The user wanted the mode buttons to feel larger and more prominent than before.
- What didn't work: No browser playtest yet, so this is build-verified only.
- Next: Check the main menu on narrow and desktop layouts to make sure the wider mode buttons still feel balanced above the leaderboard section.

---

## Full notes

- Added a dedicated mode-tab width so the `CAMPAIGN` / `ARCADE` buttons can grow without also widening the `PILOTS` / `CORPS` tabs.
- Updated the mode-tab hit zones and draw path to use the wider width while keeping height, placement, and behavior unchanged.
- `npm.cmd run build` passes after the width update.
