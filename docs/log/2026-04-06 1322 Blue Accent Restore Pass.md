# 2026-04-06 1322 Blue Accent Restore Pass

## TL;DR
- What changed: Restored some of the old yellow/gold accents in the blue palette while keeping the newer blue base and orange enemy/globe thread.
- Why: The user liked the earlier yellowish accent layer in the blue theme and wanted that feel back.
- What didn't work: Nothing blocked implementation.
- Next: Playtest the blue palette in motion and decide whether the gold accents should spread any further or stay limited to the key UI/readability touches.

---

## Full notes

- Updated the `blue` palette in `src/game/constants.ts`.
- Restored the older yellow/gold treatment on:
- `HUD`
- `GATE`
- `NPC`
- Kept the newer deeper blue background and orange enemy/globe/hazard thread from the recent blue-direction pass.
- Verified with `npm.cmd run build`.
