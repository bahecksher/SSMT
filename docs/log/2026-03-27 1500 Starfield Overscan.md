# 2026-03-27 1500 Starfield Overscan

## TL;DR
- What changed: Expanded the menu and gameplay starfields beyond the game bounds and added a filled background pass behind the stars.
- Why: User was seeing black edge lines and wanted the whole field to stay star-filled.
- What didn't work: Nothing blocked; build passed after the starfield coverage update.
- Next: Playtest a few browser sizes and devices to see whether any remaining seams come from page/canvas styling instead of scene rendering.

---

## Full notes

- Added starfield overscan in both `MenuScene` and `GameScene` so stars are spawned and drawn beyond the visible frame edges.
- Increased star counts slightly to keep density consistent across the larger draw area.
- Added a dark filled backing rectangle under the stars so tiny scaling gaps do not expose pure black.
- Left gameplay star drift behavior unchanged aside from the larger wrap area.
- Verified with `npm.cmd run build`; build succeeded with the same existing large chunk warning.
