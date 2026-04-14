# 2026-04-14 0107 Company Rep Clarity

## TL;DR
- What changed: MissionSelect now explicitly explains that accepted contracts pay bonus credits and rep on extraction, locked favor cards point toward contracts, and extraction results show the rep actually claimed.
- Why: Players could see rep numbers and thresholds, but the game was not clearly stating the earn rule or the extraction requirement.
- What didn't work: Nothing major failed; this stayed inside existing MissionSelect and results UI.
- Next: Browser-playtest the new copy on narrow screens and confirm the results panel still feels readable when completed missions wrap.

---

## Full notes

- Added an explicit reputation rule line near the MissionSelect header.
- Updated mission reward copy so rep payout is tied more clearly to extraction.
- Updated locked favor wording to point players at contracts rather than only showing a threshold.
- Added extraction-result rep summaries and per-mission rep payout lines, plus a death-state reminder that no rep was claimed.
- Verified with `npm.cmd run build`.
