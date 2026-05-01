# 2026-05-01 0100 Boss Player Layer and Core Reticles

## TL;DR
- What changed: Raised the player token above boss bodies and added clearer exposed-core reticles to both bosses.
- Why: The player could disappear under boss graphics while flying around them, and the exposed core needed a clearer "hit this" visual.
- What didn't work: No live boss visual pass was run in this session; only build verification.
- Next: Use `Shift+0` to test both boss variants and confirm the player remains visible while the opened core target reads clearly.

---

## Full notes

- Set `Player.graphic` depth to `20`, above boss/hazard gameplay graphics but below UI overlays.
- Added a pulsing reticle ring and four rotating tick marks around the Regent gunship exposed core.
- Added the same exposed-core reticle treatment to the Slag Hauler.
- Existing core contact/breach collision radii are unchanged; this is a visual clarity pass.
- Build verification passed with `npm.cmd run build`.
