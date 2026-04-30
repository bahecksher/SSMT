# 2026-04-30 1229 Versus Death Spectate Text Removal

## TL;DR
- What changed: removed the `NO EXTRACT // BEST CASE DRAW...` arena text from local death spectate.
- Why: it added clutter over the spectate arena and was not needed moment-to-moment.
- What didn't work: no live two-window visual pass was run in this session.
- Next: verify local death spectate keeps the arena clear while local extraction still shows the auto-win countdown.

---

## Full notes

- Kept the extracted-player auto-win countdown intact.
- Hid the death-only status label in `showVersusWaitingUi()`.
- `npm.cmd run build` passes.
