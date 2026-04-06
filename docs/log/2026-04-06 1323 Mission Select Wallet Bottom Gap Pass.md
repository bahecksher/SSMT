# 2026-04-06 1323 Mission Select Wallet Bottom Gap Pass

## TL;DR
- What changed: Added extra spacing below the Mission Select `WALLET` line to match the breathing room above it more closely.
- Why: The user wanted a couple of spaces below `WALLET`, not just above it.
- What didn't work: Nothing blocked implementation.
- Next: Playtest the favor section on compact screens and make sure the extra gap still leaves the card stack feeling balanced.

---

## Full notes

- Updated `getBriefingLayoutConfig()` in `src/game/scenes/MissionSelectScene.ts` so the spacing between the wallet header and the favor-grid start now includes the same wallet-header offset that was already being used above the header.
- This keeps the extra room as real layout space instead of a one-off text nudge.
- Verified with `npm.cmd run build`.
