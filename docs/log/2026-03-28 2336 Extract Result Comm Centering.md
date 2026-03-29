# 2026-03-28 2336 Extract Result Comm Centering

## TL;DR
- What changed: the extraction results screen now pins the Slick comm line in the same middle-of-frame slot used on the destroyed screen
- Why: extraction was still resetting the comm panel to the top edge instead of keeping it in the results layout
- What didn't work: only the death path was using the computed in-frame comm position
- Next: quick visual check on both death and extraction to confirm the shared slot feels balanced

---

## Full notes

- Updated `GameScene.showResultUi()` so both result states compute one comm position from the result content block and the lower action area.
- Extraction now pins Slick to that shared result slot; death still pins both Slick and Regent there.
- Left the rest of the result layout logic unchanged.
- Verified with `npm.cmd run build`.
