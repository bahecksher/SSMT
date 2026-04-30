# 2026-04-29 1948 Unified Top Nav Layout

## TL;DR
- What changed: introduced `src/game/ui/menuLayout.ts` exporting `getTopNavMetrics` + `getPrimaryActionMetrics`, then routed Menu, MissionSelect, VersusLobby, and HowToPlay corner buttons (HOW TO PLAY / GUIDE / SETTINGS / MENU / BACK) through the shared metrics so left/right corners and font sizes mirror across screens. Menu's TAP TO START and MissionSelect's DEPLOY now share the same bottom-anchor y.
- Why: user asked for a unified look across menu / mission select / versus that scales cleanly from PC down to iPhone 13 mini (375×812 logical). Each scene was hand-tuning its own corner offsets, fonts, and bottom CTA y, so the chrome jumped around between screens.
- What didn't work: nothing — first pass landed without TS errors. Build passes (`npm.cmd run build`).
- Next: live iPhone 13 mini playcheck of the menu / mission select / lobby / how-to-play chrome to confirm the shared metrics actually mirror visually and don't crowd the leaderboard / rep panel content above. Then decide whether to also unify HowToPlay's PREV/NEXT row, TutorialArena BACK (currently top-right), and HUD chrome.

---

## Full notes

### Files changed
- `src/game/ui/menuLayout.ts` (new): `getTopNavMetrics` returns `{ leftCenterX, rightCenterX, centerY, width, height, fontSizePx, marginX }`. Driven by `isNarrowViewport` / `isShortViewport` plus a `gameWidth <= 360` veryCompact branch so iPhone 13 mini portrait lands on the narrow row alongside other phones. `getPrimaryActionMetrics` returns the bottom CTA y plus a font px.
- `src/game/scenes/MenuScene.ts`:
  - Imported the shared helpers.
  - Dropped unused `shortMenu` local.
  - HOW TO PLAY button: `createHowToPlayButton` now reads from `getTopNavMetrics()` for x/y/w/h/font.
  - SETTINGS button: same — `createSettingsUi` pulls width, x, y, height, font from the helper. Panel layout still uses local `compactMenu` for inner rows.
  - TAP TO START y now = `getPrimaryActionMetrics(layout).centerY`. The four leaderboard/positionMenuComm sites that previously recomputed `layout.gameHeight - (compactMenu ? 48 : 60)` now share the same metric, so the comm/leaderboard reservation tracks the same baseline.
- `src/game/scenes/MissionSelectScene.ts`:
  - Imported the shared helpers.
  - `drawMenuButton` (top-left MENU) now mirrors Menu's HOW TO PLAY position and uses `nav.fontSizePx`.
  - `createSettingsUi` (top-right SETTINGS) mirrors Menu's SETTINGS position. Panel layout still uses `briefing.veryCompact/compact` for inner rows.
  - `getBriefingLayoutConfig` derives `deployY` from `getPrimaryActionMetrics(layout).centerY` so DEPLOY shares the same bottom anchor as Menu's TAP TO START. Rep panel above DEPLOY rebalances automatically because `repRowsAvailableHeight` already keys off `deployY - deployButtonHeight/2`.
- `src/game/scenes/VersusLobbyScene.ts`:
  - Imported `getTopNavMetrics`.
  - BACK button now uses the shared metrics for x/y/w/h.
  - `makeButton` gained an optional `fontSizePx` param (default 13) so BACK can pass `nav.fontSizePx` while CREATE/JOIN/READY/CANCEL keep the larger lobby font. Big lobby buttons unchanged.
- `src/game/scenes/HowToPlayScene.ts`:
  - Imported `getTopNavMetrics`.
  - BACK button placement + size + font now from the helper.
  - `createButton` gained an optional `fontSizePx` param (default 13). PREV/NEXT/TUTORIAL still use 13.

### iPhone 13 mini scaling
At 375×812 portrait the narrow breakpoint fires (≤390) and `isShortViewport` does not (812 > 700). The shared helper's `compact` branch is selected (narrow OR short OR width≤420). Width=96 / height=30 / font≈11 land for every corner button across Menu, MissionSelect, Lobby, How To Play, so left and right corners now sit on the same row. Bottom CTA centers ~38px above the bottom edge across both Menu and MissionSelect.

### Out of scope this pass (logged for follow-up, not silently fixed)
- VersusLobbyScene has no SETTINGS panel — only BACK is in the top-left. The right corner stays empty for now.
- TutorialArenaScene BACK still sits top-right (`gameWidth - 28 - buttonWidth/2`) instead of top-left. Not touched this pass since the in-arena chrome is its own design.
- HUD / GameScene / GameScene's pause overlay still own their own button placement.
- Title hero sizing varies a lot between Menu (32–42), MissionSelect (15–19), VersusLobby (24–32) by design — left alone.

### Verify
1. `npm.cmd run build` — passes.
2. `npm.cmd run dev`, open at iPhone 13 mini-sized viewport (~375×812). Confirm:
   - HOW TO PLAY (Menu) and MENU (MissionSelect) and BACK (Lobby + How To Play) sit at the same x/y with the same width/height/font.
   - SETTINGS sits in the same right-corner position on Menu and MissionSelect.
   - TAP TO START (Menu) and DEPLOY (MissionSelect) sit at the same bottom y.
3. Open at desktop (≥1280 wide). Same checks — the buttons should grow uniformly, not jump.
