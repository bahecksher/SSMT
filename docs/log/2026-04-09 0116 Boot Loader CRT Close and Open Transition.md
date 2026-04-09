# 2026-04-09 0116 Boot Loader CRT Close and Open Transition

## TL;DR
- What changed: Replaced the outward-only menu reveal with a brief close-in to a center slit followed by an open-back-out CRT transition, using the HUD color instead of white for the main shutters and flash
- Why: The user wanted a close-in and open transition and felt the white treatment was too abrasive
- What didn't work: No implementation blockers; `npm.cmd run build` passed after the transition rewrite
- Next: Hard-refresh the browser and check whether the new two-step CRT motion feels cleaner and more natural on cold load

---

## Full notes

- Updated `src/game/scenes/MenuScene.ts` so the transition now animates top and bottom shutters inward from the edges, pauses briefly on a narrow center slit, and then opens them back out.
- Swapped the main transition treatment to `COLORS.HUD` for the shutters, glow, and flash while keeping a white core line for crispness at the center.
- Left the menu title-font refresh behavior unchanged.
- Verified the project still builds with `npm.cmd run build`.
