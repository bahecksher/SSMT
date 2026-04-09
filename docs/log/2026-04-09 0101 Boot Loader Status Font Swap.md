# 2026-04-09 0101 Boot Loader Status Font Swap

## TL;DR
- What changed: Changed the boot loader status line to use the alternate UI font and removed the now-unused `TITLE_FONT` import from `BootScene`
- Why: The user wanted the loading-screen status text to appear in the other font
- What didn't work: The first build failed because the font swap left an unused import behind
- Next: Hard-refresh the browser to confirm the updated font feels right alongside the larger Slick intro and CRT menu reveal

---

## Full notes

- Updated `src/game/scenes/BootScene.ts` so the `Securing Connecting` line now renders with `UI_FONT`.
- Cleaned up the unused `TITLE_FONT` import after the typography swap.
- Verified the project still builds with `npm.cmd run build`.
