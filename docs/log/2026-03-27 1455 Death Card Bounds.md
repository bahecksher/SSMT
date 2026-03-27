# 2026-03-27 1455 Death Card Bounds

## TL;DR
- What changed: Expanded the death result card layout so both action options stay inside the framed box.
- Why: User noticed `MENU` was falling outside the death-screen panel.
- What didn't work: Nothing blocked; build passed after adjusting the death-only panel size and action placement.
- Next: Quick visual playtest on mobile to make sure the taller death card still feels balanced.

---

## Full notes

- Added explicit death-only panel sizing in the result UI instead of relying on the extraction card dimensions.
- Kept the death comm panel centered, then pushed `BEST`, `TAP TO RETRY`, and `MENU` to fixed positions that remain inside the enlarged card.
- Left extraction layout unchanged.
- Verified with `npm.cmd run build`; build succeeded with the same existing large chunk warning.
