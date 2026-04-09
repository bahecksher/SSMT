# 2026-04-09 0109 Boot Loader CRT Transparency Tuning

## TL;DR
- What changed: Softened the outward white CRT transition by reducing the opacity of the shutters, center glow, core line, and flash
- Why: The user wanted the white transition back to a semi-transparent look
- What didn't work: No implementation blockers; `npm.cmd run build` passed after the opacity tuning
- Next: Hard-refresh the browser and confirm the transition still reads clearly while feeling less harsh

---

## Full notes

- Updated `src/game/scenes/MenuScene.ts` so the outward white shutters now render at `0.68` alpha.
- Reduced the glow line to `0.82`, the core line to `0.9`, and the white flash to `0.12` to keep the whole effect in the same softer visual family.
- Left the outward direction and title-font refresh behavior unchanged.
- Verified the project still builds with `npm.cmd run build`.
