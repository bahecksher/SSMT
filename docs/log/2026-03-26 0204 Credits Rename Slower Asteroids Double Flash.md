# 2026-03-26 0204 Credits Rename Slower Asteroids Double Flash

## TL;DR
- What changed: HUD "SALVAGE" renamed to "CREDITS"; asteroid base speed reduced 110→70; beam warning now flashes red twice; mode designated "Quick Play"
- Why: User-requested tuning and naming adjustments
- What didn't work: Nothing
- Next: Playtest on mobile, continue toward Phase 6

---

## Full notes

### Credits rename
- HUD label changed from "SALVAGE:" to "CREDITS:" in Hud.ts
- Reflects that the score represents more than just salvage collection

### Slower asteroids
- DRIFTER_SPEED_BASE reduced from 110 to 70 in tuning.ts
- Per-phase speed scaling still applies on top of this base

### Double beam warning flash
- Overlays.beamWarningFlash now fires two sequential red flashes (250ms each with a gap between)
- Second flash is slightly brighter (0.3 vs 0.25 alpha) for urgency ramp
- Beams still spawn at the same time as the flash — the warning telegraph line on the beam itself provides the dodge window

### Quick Play mode
- Recorded in decisions.md: the current game loop is designated "Quick Play" mode
