# 2026-04-06 1312 Mission Select Wallet Spacing Pass

## TL;DR
- What changed: Nudged the Mission Select wallet header slightly downward to add a bit more space above it.
- Why: The user wanted one more space above the `WALLET` readout in the favor section.
- What didn't work: Nothing blocked implementation.
- Next: Playtest the favor section on compact screens and see whether any other tiny spacing adjustments would help.

---

## Full notes

- Updated `getFavorSectionTop()` in `src/game/scenes/MissionSelectScene.ts` to add a small vertical offset before drawing the wallet text.
- Kept the change targeted so the wallet header gets more breathing room without restructuring the rest of the favor card layout.
- Verified with `npm.cmd run build`.
