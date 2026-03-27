# 2026-03-27 0026 Slick Comms Overlay

## TL;DR
- What changed: Added a reusable Slick comms overlay with a vector hologram portrait and reactive banter on the menu, during gameplay, and on the game over screen.
- Why: Slick should feel like an active operator in the training module, not just a name in the title.
- What didn't work: Initial build failed because Phaser `Graphics` did not support the moustache curve calls used in the first portrait draft.
- Next: Playtest the message cadence and placement, then decide whether to add more event-specific lines or voice/audio later.

---

## Full notes

Implemented `SlickComm` as a reusable UI component rather than baking portrait/text logic into each scene. The portrait is drawn entirely with Phaser vector graphics in a neon hologram style so it ships without external art dependencies. Slick currently speaks on menu intro, run start, phase advance, gate open, shield pickup, extraction, and death/result moments.
