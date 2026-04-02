# 2026-04-02 1705 Result Screen Arena Layout Pass

## TL;DR
- What changed: Rebuilt the `DESTROYED` and `EXTRACTED` overlays to size from the arena bounds, increased the title/score scale, and rebalanced the vertical spacing between summary text, mission results, comm panels, and buttons
- Why: The old result layout was tied to raw viewport percentages, which made the screens feel off-center and uneven around the arena
- What didn't work: No live device/browser playcheck yet this session; verification was limited to `npm.cmd run build`
- Next: Visually check both result states on desktop and short-phone layouts for final spacing feel

---

## Full notes

- Replaced the previous result panel top/bottom math with an arena-centered panel inset from the playfield bounds, so the overlay now follows the actual game box instead of the overall browser height.
- Increased the result title and score font sizing and switched the content stack to sequential spacing from the panel top, which gives the screen a larger, more deliberate hierarchy.
- Let wallet/cut and mission result lines wrap inside the result panel width instead of assuming enough horizontal room at all aspect ratios.
- Kept the pinned comm window logic, but recalculated its position from the resized content gap so it stays centered between the mission summary block and the retry/menu buttons.
- Verified with `npm.cmd run build`.
