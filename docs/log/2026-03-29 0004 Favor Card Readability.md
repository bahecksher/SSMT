# 2026-03-29 0004 Favor Card Readability

## TL;DR
- What changed: increased favor card height, boosted text sizes, added stronger contrast, and separated favor label/value/detail lines for easier scanning
- Why: the favor text on MissionSelect was too cramped and low-contrast to read comfortably
- What didn't work: the original single-line favor text treatment packed too much information into a small card
- Next: check the updated favor cards on a phone-sized screen and tune further if any company card still feels cramped

---

## Full notes

- Increased `FAVOR_CARD_HEIGHT` so the favor section has room for a clearer text hierarchy.
- Raised the wallet/header text sizes slightly and added dark stroke treatment for readability against the hologram background.
- Reworked each favor card to use four clearer layers:
  - company name
  - favor label
  - boost value plus active/cost state
  - rep/lock detail
- Added a stronger dark card base plus a left accent bar so the company color reads without lowering text contrast.
- Verified with `npm.cmd run build`.
