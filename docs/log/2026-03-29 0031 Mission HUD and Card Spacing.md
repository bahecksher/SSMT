# 2026-03-29 0031 Mission HUD and Card Spacing

## TL;DR
- What changed: replaced the bottom mission pill truncation with clearer mission shorthand and removed the dead vertical gap between mission text and reward on the briefing cards
- Why: the HUD was hiding too much of each mission label, and the MissionSelect cards were still wasting vertical space
- What didn't work: the old HUD pill logic used a blunt 14-character cut, and the mission cards pinned reward/company text too low in the card
- Next: quick playtest with a few long contract types to confirm the new HUD shorthand still feels obvious at a glance

---

## Full notes

- Added `getHudMissionLabel()` in `Hud.ts` so the bottom tracker now shows concise objective-specific labels like `EXTRACT 500 CR`, `RIVALS x3`, and `SURVIVE 5 + EXIT` instead of chopping the raw mission text.
- Slightly tightened the pill spacing and increased text contrast in the bottom mission tracker.
- In `MissionSelectScene`, reward text now sits directly below the mission label, and the company tag now sits directly below the reward line.
- This removes the empty row that was making mission cards feel taller than their actual content.
- Verified with `npm.cmd run build`.
