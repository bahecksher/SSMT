# 2026-03-28 2313 Result Action Buttons

## TL;DR
- What changed: the death/extraction results overlay now uses two real rounded-rect buttons for `TAP TO RETRY` and `MENU`, both sized to the comm panel width and laid out with even spacing in the lower panel area
- Why: the old plain-text actions felt too loose, and you asked for clearer buttons with balanced spacing
- What didn't work: relying on "tap anywhere" for retry no longer matched the intended post-run UI once the actions were meant to be explicit buttons
- Next: playtest the buttons on mobile and confirm the lower action area still feels balanced with 0-3 mission lines

---

## Full notes

- Updated `GameScene.showResultUi()` to reserve a bottom action band, lay out the two result buttons inside it, and center the death comm panel in the remaining gap above the buttons.
- Added a local `createResultButton()` helper in `GameScene` for the shared button visuals and interaction behavior.
- Disabled the old empty-space retry behavior on the results overlay so the new buttons are the actual controls.
- Verified with `npm.cmd run build`.
