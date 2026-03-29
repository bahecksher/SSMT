# 2026-03-28 2158 Death Results Comm Centering

## TL;DR
- What changed: death comm placement now centers the Slick/Regent panel in the open space between the mission results block and the `TAP TO RETRY` prompt
- Why: the previous fix cleared the overlap, but the panel still sat a little too high
- What didn't work: anchoring the panel to the top of the available gap looked safe but not visually balanced
- Next: check the centered placement on a phone-sized viewport with 1-3 mission lines

---

## Full notes

- Updated `GameScene.showResultUi()` so death comm placement uses the measured top and bottom bounds of the open gap, subtracts the 70px comm panel height, and positions the panel halfway through the remaining vertical space.
- Kept the extraction layout and the comm component implementations unchanged.
- Verified with `npm.cmd run build`.
