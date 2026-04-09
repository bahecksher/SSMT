# 2026-04-09 0059 Boot Loader Progress and CRT Reveal

## TL;DR
- What changed: The boot Slick intro was made larger, the loading bar now keeps progressing until the actual handoff moment, and the menu now appears through a CRT-style reveal
- Why: The user wanted the loader flavor text easier to read, the bar to feel truthful, and the transition into the menu to feel like a TV powering on
- What didn't work: The first CRT pass used `setScaleX` on Phaser rectangles, but the local typings only expose `setScale`, so that setup was adjusted and the build passed
- Next: Hard-refresh test the full startup flow in-browser and tune the CRT timing only if it feels too abrupt or too slow

---

## Full notes

- The boot bar now treats asset loading and the post-load wait as separate phases so it does not sit at 100% before the menu can actually appear
- The menu reveal is intentionally local to the boot-to-menu path; other scene entries still behave normally
- `npm.cmd run build` passes
