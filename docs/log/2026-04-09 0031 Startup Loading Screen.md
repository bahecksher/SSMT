# 2026-04-09 0031 Startup Loading Screen

## TL;DR
- What changed: `BootScene` now renders a live loading screen with starfield, rotating globe/ring, scanline overlay, status text, and a real loading bar during startup
- Why: Cold browser loads looked frozen for too long while the audio pack and fonts initialized
- What didn't work: The first pass used `Graphics.getBounds()`, but Phaser's typings here do not expose that API, so the loading bar switched to stored geometry instead
- Next: Hard-refresh test the startup flow in-browser, then resume the pending mobile viewport validation

---

## Full notes

- This work intentionally diverged from `docs/plans/2026-04-07 0148 Plan - Mobile Screen Cleanup.md` because the user asked for a startup-loading fix; scope stayed limited to boot presentation only
- Reused the existing palette and `GeoSphere` so the loader feels like the same world as the menu/game instead of a generic placeholder
- `npm.cmd run build` passes
