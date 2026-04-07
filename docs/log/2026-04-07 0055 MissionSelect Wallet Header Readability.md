# 2026-04-07 0055 MissionSelect Wallet Header Readability

## TL;DR
- What changed: swapped the MissionSelect wallet header off the bold LCD title font and onto the cleaner UI font at a slightly larger size
- Why: the all-caps `WALLET` text was reading too tightly, especially on the longer campaign wallet line
- What didn't work: nothing blocked this pass
- Next: keep an eye on other dense MissionSelect title lines and soften them if similar readability issues show up

---

## Full notes

- Updated `src/game/scenes/MissionSelectScene.ts` so the wallet header in the favor section now uses `UI_FONT` instead of `TITLE_FONT`.
- Removed the bold styling from that header and nudged the text size up by one step to open the glyph spacing a bit.
- Left the rest of the MissionSelect typography unchanged so this stays a targeted readability fix.
- Verified with `npm.cmd run build`.
