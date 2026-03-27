# 2026-03-26 2158 Mobile Controls and Visual Polish

## TL;DR
- What changed: Overhauled mobile controls from pointer-follow to invisible virtual joystick with inertia. Improved visual clarity (mining zones, hitboxes, death effect). Changed ship to triangle. Reduced difficulty.
- Why: Pointer-follow was unusable on mobile — finger obscured the target and there was no fine movement control. Hitboxes were invisible making collisions feel unfair. Mining zones were nearly invisible. Death flash was jarring.
- What didn't work: Two-zone thumbstick (left=fine, right=fast) — the second thumb got in the way and the fine side felt unresponsive. Tried many sensitivity/inertia combos before landing on current values.
- Next: Continue fine-tuning controls through playtesting. Consider audio and settings screen (phase 6 items).

---

## Full notes

### Visual changes
- **Mining zone**: Changed from barely-visible red ring (0.06 alpha) to orange (0xffaa00) pulsing fill + rotating dashed ring segments. Clearly visible when you're in range.
- **Hitboxes**: Added always-visible collision circles for player (cyan, PLAYER_RADIUS), asteroids (red, drifter.radius), and salvage (red, SALVAGE_KILL_RADIUS).
- **Ship shape**: Changed from diamond to equilateral triangle that rotates to face direction of travel.
- **Death effect**: Replaced double inverted-color flash with a static red overlay held for 1s then fade out. Less disorienting.

### Mobile controls — iterative tuning
Started from pointer-follow (ship moves to where you touch). This was the original decision but proved bad on mobile.

Progression of changes:
1. **Invisible joystick**: Touch-start = anchor, drag = direction/speed. Initial SWIPE_MAX_DISTANCE=100, dead zone=10.
2. **Too fast**: Increased max distance to 150, added cubic magnitude curve.
3. **Zero friction**: Ship drifts forever in space. Felt right thematically.
4. **Speed accumulation problem**: Rapid corrections caused runaway velocity. Added light friction (0.99), anchor re-centering, switched to quadratic curve.
5. **Two-zone experiment**: Left half = fine control (30% speed cap), right half = full speed. User rejected — second thumb gets in the way and fine side felt dead.
6. **Reverted to single joystick**: Settled on power-1.5 curve, lerp 0.10–0.25 (scales with magnitude), max speed 750, dead zone 0, anchor re-centering at 0.03 rate.

Final tuning values:
- `SWIPE_DEAD_ZONE = 0` (any movement registers)
- `SWIPE_MAX_DISTANCE = 150` (full drag distance)
- `PLAYER_MAX_SPEED = 750`
- Magnitude curve: `pow(magnitude, 1.5)`
- Lerp: `0.10 + magnitude * 0.15`
- Friction when not touching: `0.99`
- Anchor re-center rate: `0.03` (when drag < 30% of max distance)

### Difficulty rebalancing
Reduced to give breathing room while controls are being tuned:
- Enemy ships: phase 2 → phase 5
- Beam hazards: phase 5 → phase 7
- Max concurrent asteroids: roughly halved (formula changed from `8 + phase*6 + phase^2.1` to `4 + phase*3 + phase^1.6`)
