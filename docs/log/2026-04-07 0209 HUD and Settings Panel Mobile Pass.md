# 2026-04-07 0209 HUD and Settings Panel Mobile Pass

## TL;DR
- What changed: HUD now abbreviates labels on narrow screens (CR:/LV/M instead of CREDITS:/LIVES/MISS), settings panels use proportional row spacing on veryCompact, pause menu debug gap tightened
- Why: iPhone 13 mini (~375x635) viewport had HUD overflow and settings panels with fixed offsets that didn't scale
- What didn't work: Most compact layout work was already done in prior sessions (ultraDenseFavorLayout, ultraCompactResults, etc.) - this pass focused on remaining gaps
- Next: On-device smoke test to confirm no remaining collisions

---

## Full notes

### HUD abbreviations (Hud.ts)
- Added `narrowHud` flag (triggered when `isNarrowViewport`, i.e. width <= 390px)
- On narrow screens: `CR:` instead of `CREDITS:`, font 11px instead of 13px
- Lives: `LV {n}` instead of `// LIVES {n}`
- Missions: `M{n}` instead of `// MISS {n}`
- Element gap reduced from 10px to 6px between HUD items
- Left margin reduced from 16px to 10px
- Estimated width savings: ~100px on the top row, preventing overflow at 375px

### Settings panel spacing (MenuScene.ts, MissionSelectScene.ts)
- Replaced fixed pixel offsets (30, 64, 98, 132, 170, 188, 216, 234) with proportional row gaps
- veryCompact: 30px row gap (was 34), panel height 236px (was 252/264)
- Volume section gaps tightened: 14px slider gap (was 18), 18px between sliders (was 28)
- Non-veryCompact layouts produce identical positions to before

### Pause menu (GameScene.ts)
- Debug phase button first row gap: 34px on densePause (was 44px for all sizes)
- Saves 10px of vertical space on small screens
