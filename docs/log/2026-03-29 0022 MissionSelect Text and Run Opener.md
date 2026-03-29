# 2026-03-29 0022 MissionSelect Text and Run Opener

## TL;DR
- What changed: increased MissionSelect text sizing throughout, removed briefing-screen liaison chatter, and moved the opening contract voiceover to the start of the run
- Why: the briefing text still felt too small, and the liaison chatter worked better as a game-start opener than as tap feedback inside the menu
- What didn't work: the previous MissionSelect comm panel added noise and took attention away from making contract/favor choices readable
- Next: play one run with no accepted contracts and one with mixed-company contracts to confirm the new opener behavior feels right

---

## Full notes

- Increased text sizes across MissionSelect headers, mission cards, reroll text, wallet header, favor cards, and deploy copy.
- Removed the MissionSelect liaison comm UI and the select/deselect/favor confirmation dialogue so the briefing screen stays quiet.
- Updated `GameScene` so run start now picks one opening speaker:
  - no active contracts -> Slick opener
  - one or more active contracts -> one random active contract liaison opener
- Active-contract liaison openers use rep-aware lines when available, but fall back to level-1 liaison dialogue for companies with no rep yet.
- Verified with `npm.cmd run build`.
