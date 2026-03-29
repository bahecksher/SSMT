# Spec - Paid Mission Rerolls
_Created: 2026-03-29 0113_

## Goal
Make MissionSelect easier to read while giving mission rerolls a real wallet cost so contract fishing is a meaningful decision.

## MissionSelect readability
- The `WALLET` header above the favor grid should be larger and easier to spot.
- Favor cards should show company name plus liaison name only.
- Do not show the liaison role on the card title line.

## Reroll economy
- Mission rerolls now cost wallet credits in addition to consuming a reroll charge.
- Reroll cost stacks upward within the current briefing visit:
  - first reroll: `200c`
  - second reroll: `400c`
  - third reroll: `600c`
- The reroll button should show the current credit cost.
- A reroll is only available when the player has both:
  - at least one reroll charge remaining
  - enough wallet credits left after currently selected favors

## Out of scope
- Persisting the reroll price escalation between separate visits to MissionSelect
- Reworking favor prices in this pass
- Changing reroll recharge rules on extraction
