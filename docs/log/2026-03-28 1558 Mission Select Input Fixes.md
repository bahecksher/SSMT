# 2026-03-28 1558 Mission Select Input Fixes

## TL;DR
- What changed: Fixed 3 bugs in MissionSelectScene input handling, tuned hold duration
- Why: Accept was blocked when discards were exhausted; hold-to-discard didn't work on mouse; hold triggered too fast
- What didn't work: Global pointerup/pointerdown listeners on the scene kept racing with per-card handlers in Phaser's event pipeline
- Next: Playtest all 9 mission types end-to-end

---

## Full notes

### Bug 1: Accept blocked after discards exhausted
`pointerdown` was gated by `discardsRemaining > 0`, which prevented `discardHoldIndex` from being set. Since `pointerup` checked `discardHoldIndex === index`, tap-to-accept never triggered when discards were 0. Fix: always set `discardHoldIndex` on pointerdown; gate the discard fill/execution in `update()` instead.

### Bug 2: Hold-to-discard broken on mouse
A global `pointerup` listener on `this.input` fired before the card's own `pointerup` handler, calling `cancelHold()` and resetting `discardHoldIndex` to -1. The card handler then saw no match and did nothing. First attempted a `cardHandledUp` flag approach — still didn't work because the global listener ran first on mouse. Fix: removed all scene-level input listeners. Per-card `pointerout` already handles "finger left the card."

### Bug 3: Hold triggered too fast
800ms felt too quick — easy to accidentally discard. Bumped `DISCARD_HOLD_MS` from 800 to 1500ms.

### Key lesson
Phaser's event propagation order between scene-level `this.input.on()` and per-object handlers is not guaranteed across mouse vs touch. Avoid mixing both for the same event type — use per-object handlers only and rely on `pointerout` for boundary cases.

### Files changed
- `src/game/scenes/MissionSelectScene.ts` — all 3 fixes
