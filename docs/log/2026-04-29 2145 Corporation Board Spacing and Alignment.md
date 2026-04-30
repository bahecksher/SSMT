# 2026-04-29 2145 Corporation Board Spacing and Alignment

## TL;DR
- What changed: increased the gap between the corporation donut chart and the corporation rows, and rebuilt the corporation rows as fixed rank / name / score columns so the list reads uniformly.
- Why: user feedback that the chart sat too close to the corp rows and the corp list looked uneven, likely left-aligned / inconsistent.
- What didn't work: the previous board rendered each row as one centered text string, so varying corporation-name widths made the list feel visually off even though the text objects were centered.
- Next: quick live menu pass on desktop and phone-sized viewport to confirm the new spacing still fits cleanly above the Slick comm panel.

---

## Full notes

- Direct user request took priority over the previous tutorial-focused active plan, so this session established a new small menu-layout plan instead of continuing the tutorial track.
- In `src/game/scenes/MenuScene.ts`:
  - increased the corporation row start offset below `CorporationScoreGraph`
  - swapped the corporation board rows from one centered line to three aligned text columns:
    - rank on the left
    - corporation name in a fixed left-aligned name column
    - score in a fixed right-aligned score column
- `npm.cmd run build` passes after the layout change.
