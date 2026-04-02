# 2026-04-02 1810 Compact Transparent Bottom Gameplay Comms

## TL;DR
- What changed: Bottom-pinned gameplay comms now switch into a compact panel layout with reduced minimum height, tighter spacing, smaller portrait scale, and more transparent panel fills
- Why: The restored original arena framing needed a lighter comm treatment that felt less bulky and showed more of the action behind it
- What didn't work: The previous bottom comm styling stayed too tall and opaque once the arena reserve was removed
- Next: Playcheck long gameplay comm lines on a phone-sized viewport to make sure multi-line wraps still feel readable

---

## Full notes

Updated `SlickComm`, `RegentComm`, and `LiaisonComm` so their bottom-pinned gameplay state uses a compact variant instead of the full panel layout. The result layout path still uses the larger, heavier panel treatment.

Lowered the gameplay bottom inset slightly in `GameScene` so the slimmer comm card sits lower on the screen.

Validation: `npm.cmd run build`
