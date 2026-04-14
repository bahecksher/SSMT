# 2026-04-13 2341 Startup Load Optimization

## TL;DR
- What changed: Boot now preloads only the menu and earliest gameplay music layers, trims the forced startup hold from 4 seconds to 1.5 seconds, and background-warms later music instead of blocking the menu behind it.
- Why: Cold start was front-loading roughly 175 MB of WAV music before the player could reach the menu.
- What didn't work: I couldn't measure browser-side cold-load timings headlessly in this session, so validation is code-path analysis plus a passing production build.
- Next: Cold-refresh in a browser to confirm the shorter boot still reads cleanly, then run long enough to verify phase 3+ and full-track music handoffs feel smooth on-device.

---

## Full notes

- `BootScene` was intentionally holding the player for a minimum 4 seconds even after assets were ready, which amplified the sense of slowness.
- `MusicSystem.preloadMusic` was also loading every music track up front, including several very large `.wav` files:
  - `drums-3.wav`, `bass-3.wav`, and `synth-3.wav` at about 29 MB each
  - `full-phase-1.wav` at about 37 MB
  - `full-phase-2.wav` at about 43 MB
- The boot-time music preload is now limited to `menuSynth`, `bassOne`, and `drumsTwo`, which keeps the early menu and phase 1/2 music ready while cutting the initial music payload by about 94 percent.
- Menu, Mission Select, and Game scenes now warm later music opportunistically, and the late full-phase tracks are only queued once the run is near the phase threshold that uses them.
- `npm.cmd run build` passes after the changes.
