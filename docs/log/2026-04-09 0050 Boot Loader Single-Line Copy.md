# 2026-04-09 0050 Boot Loader Single-Line Copy

## TL;DR
- What changed: The boot status now reads `Securing Connecting`, stays in the title font on one line, and the Slick intro line is also forced to remain on one line
- Why: The user wanted the boot copy tightened and visually flattened instead of allowing either line to wrap
- What didn't work: Nothing major failed; the implementation just needed a small width-fitting helper so longer intro lines would shrink rather than wrap
- Next: Hard-refresh test the startup flow in-browser and confirm the one-line fitting still feels readable on narrow screens

---

## Full notes

- Removed wrapping from both boot text elements and added a small width-fit helper in `BootScene`
- Kept the rotating globe/ring, loading bar, and ~4 second minimum display time unchanged
- `npm.cmd run build` passes
