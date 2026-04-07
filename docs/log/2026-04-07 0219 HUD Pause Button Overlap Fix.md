# 2026-04-07 0219 HUD Pause Button Overlap Fix

## TL;DR
- What changed: HUD lives/missions text now flows to second row when score grows wide enough to collide with the centered pause button
- Why: User reported that as score increases, the lives readout runs over the pause button
- What didn't work: n/a — straightforward layout fix
- Next: On-device smoke test to confirm no remaining HUD collisions at various score widths

---

## Full notes

### Problem
In campaign mode, the HUD top row shows `CR: {score} LV {lives} M{missions}`. As the score number grows (e.g. 4+ digits), the combined width pushes the lives and missions text into the centered pause button.

### Fix (Hud.ts)
- Added `topRowMaxX` field: `layout.centerX - pauseButtonHalfWidth - 8` (8px safety gap)
- `pauseButtonHalfWidth` is 29px on compact (<=430px) screens, 32px otherwise
- On each `update()`, compute the combined width of lives + missions text
- If `scoreRightX + secondaryWidth > topRowMaxX`, flow lives and missions down to `shieldRowY` (the second row, same Y as SHIELD text)
- BEST text positioning also updated: when lives/missions are on the second row, `topRowRightEdge` only considers score width, so BEST stays positioned correctly
