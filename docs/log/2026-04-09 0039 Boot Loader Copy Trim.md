# 2026-04-09 0039 Boot Loader Copy Trim

## TL;DR
- What changed: The boot loading screen now shows a single `Establishing Secure Connection...` line above the loading bar instead of stage-specific loader text, footer copy, or percentage text
- Why: The user wanted the startup screen to feel cleaner and not expose what the game was loading internally
- What didn't work: The first cleanup pass left an unused font import behind, which `tsc` caught immediately and was removed
- Next: Hard-refresh test the startup flow in-browser and confirm only the simplified message remains visible

---

## Full notes

- Kept the starfield, rotating globe/ring, and loading bar intact
- Tightened the loader panel height so the simplified layout does not leave a lot of dead vertical space
- `npm.cmd run build` passes
