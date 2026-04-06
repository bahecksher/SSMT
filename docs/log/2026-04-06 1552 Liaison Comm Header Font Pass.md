# 2026-04-06 1552 Liaison Comm Header Font Pass

## TL;DR
- What changed: moved the liaison name/title line in comm panels to the title font
- Why: that header wanted a little more authored identity without making the actual comm message harder to read
- What didn't work: nothing major; this was handled by adding a header-font option to the shared comm panel and using it only for liaison comms
- Next: playtest liaison comms at gameplay scale and confirm the title font still reads cleanly in both standard and compact panel layouts

---

## Full notes

Added an optional header font family to `CommPanel` so comm variants can style their name line independently from the body copy. `LiaisonComm` now uses `TITLE_FONT` for the liaison title header, while Slick and Regent keep the default readable font. The body text remains on `UI_FONT` for readability.
