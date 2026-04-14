# 2026-04-14 0041 Affiliation UI Signage

## TL;DR
- What changed: Added explicit current-corporation labels to the menu title block and gameplay UI so the pilot's active corporation is easier to read at a glance.
- Why: The user wanted a clearer indication of which corporation the pilot is currently working with.
- What didn't work: Nothing notable; the implementation reused the existing highest-rep affiliation rule and fit into existing UI slots.
- Next: Playtest the new labels with different rep states and decide later whether rep-driven affiliation should remain implicit or graduate into a dedicated corporation choice flow.

---

## Full notes

- Reused the existing highest-rep affiliation rule instead of introducing a new enlistment mechanic.
- Added a menu label under the pilot callsign showing the current corporation tag and name, or `FREE AGENT` when unaffiliated.
- Added an in-run top status label that displays `WORKING WITH // {tag}` using the affiliated corporation color while no boss status is occupying that slot.
- Kept the corporation leaderboard footer and arena tint behavior intact so the new label complements the existing signals rather than replacing them.
- Confirmed the project still builds successfully with `npm.cmd run build`.
