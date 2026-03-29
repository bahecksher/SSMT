# 2026-03-29 0028 Favor Selection State

## TL;DR
- What changed: made selected favors visually obvious with a real `SELECTED` badge, stronger highlight treatment, and clearer tap-state copy
- Why: the chosen/un-chosen state on favor cards was too subtle to trust at a glance
- What didn't work: relying on a mild tint and inline `ACTIVE` text was not enough to communicate selection clearly
- Next: quick phone check to make sure the new badge still reads cleanly on the compact card layout

---

## Full notes

- Selected favor cards now get a brighter fill, stronger border, thicker accent bar, and a bottom highlight strip.
- Added a top-right `SELECTED` badge so the state reads immediately without parsing the body text.
- Changed the value/detail lines to read more clearly:
  - selected: `ONLINE` and `TAP TO CLEAR`
  - unselected: cost plus `TAP TO ARM`
- Verified with `npm.cmd run build`.
