# 2026-03-28 2334 Comm Panel Size and Readability

## TL;DR
- What changed: the shared Slick/Regent/liaison comm panel is now narrower and slightly shorter, with a smaller portrait and larger text
- Why: the gameplay comm window still felt too large against the arena edge, and the body text needed to be easier to read
- What didn't work: the older 420x70 panel footprint was visually heavy and the 13px body text felt a bit cramped
- Next: check long-line wrapping and top-of-screen spacing on a phone-sized viewport

---

## Full notes

- Updated `SlickComm`, `RegentComm`, and `LiaisonComm` to use a 368px max width, 60px panel height, reduced portrait footprint, and larger 12px/14px label-body typography.
- Moved the default gameplay panel slightly higher and tightened internal spacing so the text gains room without the panel feeling bulkier.
- Updated the results overlay button width/comm-height assumptions in `GameScene.showResultUi()` to stay aligned with the new shared panel dimensions.
- Verified with `npm.cmd run build`.
