# 2026-04-07 1343 Visibility Improvements

## TL;DR
- What changed: Mining asteroid rings now yellow (0xffdd44), enemy ships filled with solid color (0.35 alpha), countdown glow/zoom removed, countdown phrase order swapped, globe decorative ring faded to 35% opacity
- Why: Gameplay readability — mining rings were grey and blended with asteroids, enemies were near-invisible outlines, countdown glow was distracting, globe ring could be confused with gameplay elements
- What didn't work: N/A — all changes were straightforward constant/alpha tweaks
- Next: On-device smoke test, gameplay tuning pass

---

## Full notes

### Mining ring color
- `DrifterHazard.ts`: Changed `miningColor` from `COLORS.ASTEROID` (0xc4ccd3, grey) to hardcoded `0xffdd44` (warm yellow)
- Only affects the mining zone ring/fill indicator, not the asteroid body itself

### Enemy ship fill
- `EnemyShip.ts`: Hull fill alpha bumped from 0.05 to 0.35
- Now matches NPCShip's fill approach (0.36) so enemies read as solid colored shapes

### Countdown text
- Removed shadow/glow (blur 0, transparent, fill false) from initial config and `refreshCountdownPalette`
- Removed per-second zoom/pulse animation — fixed scale 1, alpha 0.9
- Widened wordWrap from 320 to 500 so "STAY ALIVE" fits one line
- Swapped phrase order: STAY ALIVE > GET OUT > GET PAID > GO

### Globe ring opacity
- `GeoSphere.ts`: Added `RING_ALPHA_MULT = 0.35` applied to all ring band, segment, and debris alpha calculations
- Single constant makes it easy to tune further
