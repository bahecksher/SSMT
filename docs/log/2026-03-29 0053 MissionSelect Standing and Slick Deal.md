# 2026-03-29 0053 MissionSelect Standing and Slick Deal

## TL;DR
- What changed: tightened the MissionSelect contract cards, turned favor cards into company standing panels, and replaced Slick's flat cut with a career-banked progression deal.
- Why: the briefing still felt too tall, company progression was too hidden, and wallet payout progression needed a stronger sense of advancement.
- What didn't work: the first TypeScript pass over the new Slick deal tiers inferred an overly narrow literal type and failed the build until the active tier variable was widened.
- Next: validate the denser layout on a short phone viewport and tune the new Slick deal thresholds after a few extract-spend cycles.

---

## Full notes

- Updated `MissionSelectScene` so contract cards use a compact footer row for company/reward info instead of stacking everything vertically.
- Reworked favor cards to show:
  - company name
  - liaison name and role
  - current standing plus raw rep and next threshold
  - explicit favor effect
  - cost, shortfall, or armed state
- Added per-company standing progress bars so rep progress reads without opening any extra detail screen.
- Added `careerBankedCredits` to save data and migrated older saves by defaulting the field to `0`.
- Replaced the fixed 35/65 payout with career banking milestones:
  - under `5000c`: `35/65`
  - `5000c+`: `40/60`
  - `15000c+`: `45/55`
  - `30000c+`: `50/50`
- MissionSelect now shows current wallet totals plus the current Slick deal and next improvement threshold.
- Extraction results now show the applied wallet percentage, Slick cut percentage, and cumulative career banked credits.
- Verified the change set with `npm.cmd run build`.
