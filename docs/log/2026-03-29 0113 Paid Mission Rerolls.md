# 2026-03-29 0113 Paid Mission Rerolls

## TL;DR
- What changed: enlarged the MissionSelect wallet header, removed liaison roles from favor-card titles, and made mission rerolls cost stacking wallet credits.
- Why: the wallet header needed to stand out more, the liaison role was unnecessary clutter, and rerolling contracts needed an actual spend decision attached to it.
- What didn't work: nothing blocked the final implementation once the reroll affordability logic was tied to wallet credits left after selected favors.
- Next: play a few wallet-constrained MissionSelect passes to tune whether `200c / 400c / 600c` feels right against the fixed 60/40 split.

---

## Full notes

- Increased the `WALLET` header text size and weight above the favor grid in `MissionSelectScene`.
- Simplified favor-card title text from `company // liaison // role` to `company // liaison`.
- Added paid rerolls on top of the existing reroll stock:
  - first reroll in a visit: `200c`
  - second: `400c`
  - third: `600c`
- Reroll affordability now checks wallet credits left after currently selected favors, so the button disables if the player has already committed too much spend.
- Reroll button text now shows the current price directly.
- Verified the change set with `npm.cmd run build`.
