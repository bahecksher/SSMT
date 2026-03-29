# 2026-03-29 1307 Cursor Morph-to-Button Behavior

## TL;DR
- What changed: Custom cursor now morphs to hug interactive elements iPad-style, with a pointer tracking dot and per-button corner radius matching
- Why: Inspired by the Website project's iPadOS-style cursor morph — brings polish to the existing hologram reticle without losing the game aesthetic
- What didn't work: Nothing — clean implementation in one pass
- Next: Push to main, open PR for upstream

---

## Full notes

### Morph behavior (CustomCursor.ts)
Added a morph system to the existing hologram reticle cursor. When hovering any `useHandCursor: true` interactive element:
- The broken circle + ticks + triangle crossfade out
- A rounded rectangle outline fades in and expands from reticle-size to hug the element's bounding box
- Cursor position lerps from the pointer to the element's center (iPad "stick" feel)
- Color smoothly lerps from white to player neon green, alpha from 0.4 to 0.7
- A small filled dot at the actual pointer position stays visible inside the morphed rect so the user can track their mouse

On mouse leave, everything reverses smoothly.

### Per-button corner radius
Each interactive zone is now tagged with `.setData('cornerRadius', N)` matching its visual backing graphic's corner radius. The cursor reads this value and adds `MORPH_PADDING` so the morph rect wraps the button's corners precisely.

Corner radii tagged:
- Menu tabs (daily/weekly): 8
- Menu buttons (play/settings): 8
- Pause button: 8
- Result screen buttons: 10
- MissionSelect cards: 8
- MissionSelect reroll: 8
- MissionSelect menu button: 8
- MissionSelect favor cards: 8
- MissionSelect deploy: 12

Untagged elements fall back to `MORPH_DEFAULT_RADIUS = 8`.

### Hit filtering
`hitTestPointer` results are now filtered to only `useHandCursor: true` objects. Blocker zones (used for event stopPropagation) no longer trigger hover color or morphing.

### Tunables (top of CustomCursor.ts)
- `MORPH_LERP` — animation speed (0.25)
- `MORPH_PADDING` — space between element edge and morph rect (4px)
- `MORPH_DEFAULT_RADIUS` — fallback corner radius (8)
- `MORPH_DOT_RADIUS` — pointer tracking dot size (3px)

### Files changed
- `src/game/ui/CustomCursor.ts` — morph system, dot, hit filtering
- `src/game/scenes/MenuScene.ts` — cornerRadius data on tabs and buttons
- `src/game/scenes/GameScene.ts` — cornerRadius data on pause and result buttons
- `src/game/scenes/MissionSelectScene.ts` — cornerRadius data on cards, reroll, menu, favors, deploy

### Reference
The morph concept came from the Website project's `archive/jbma-wireframe-v3.html` cursor implementation (iPadOS-style morphing cursor with `getBoundingClientRect` + CSS transitions). Adapted to Phaser's per-frame Graphics redraw model using lerped progress state instead of CSS transitions.
