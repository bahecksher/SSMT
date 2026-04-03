# 2026-04-02 2220 Mission Pill Single-Line Label Pass

## TL;DR
- What changed: Reworked the bottom mission trackers into single centered objective labels, removed the numeric `####/####` progress row, and reduced the label sizing so the text fits inside the pill buttons more reliably
- Why: The user reported the bottom mission tracker text feeling too large for the buttons and asked to drop the numeric tracking to free space
- What didn't work: No live phone playcheck happened in-session; verification stayed at `npm.cmd run build`
- Next: Check the bottom mission pills on a real phone-sized viewport and trim the condensed labels further if any objective still wraps awkwardly

---

## Full notes

- This session intentionally diverged from the active layered-music plan to address a direct user-requested gameplay HUD readability issue.
- Updated `src/game/ui/Hud.ts` only.
- The pills still show visual progress through the subtle background fill, but the separate numeric row is gone so the label gets the full pill height.
- Also shortened a few HUD-specific mission labels (`BANK`, `HOLD`, `EXIT ... PH`) to help the condensed pill layout hold up on narrow screens.
- Verified with `npm.cmd run build`.
