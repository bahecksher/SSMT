# 2026-04-02 1643 Favor Card Portrait Scale Pass

## TL;DR
- What changed: Enlarged the MissionSelect liaison portraits again so they take most of the available portrait column inside each favor card
- Why: The first portrait pass was still too conservative and the portraits needed to read as a primary visual element
- What didn't work: This session verified with a production build only, not a live viewport/device visual pass
- Next: Playcheck the new portrait scale on short phones and desktop, then trim only if any states feel crowded

---

## Full notes

- Reworked the portrait sizing math in `MissionSelectScene` so the portrait uses almost all available vertical space in the right side of the favor card.
- Reserved top clearance for the status badge and kept a small bottom inset so the portrait stays cleanly framed rather than touching the card edges.
- Adjusted the portrait scale and text-width reservation together so the larger portrait does not collide with the company/liaison lines or the standing/offer text.
- `npm.cmd run build` passes.
- This was a focused MissionSelect polish tweak; the active layered-music plan remains unchanged.
