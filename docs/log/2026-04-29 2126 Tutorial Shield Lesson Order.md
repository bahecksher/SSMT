# 2026-04-29 2126 Tutorial Shield Lesson Order

## TL;DR
- What changed: `TutorialArenaScene` now scripts the shield lesson as first shield -> enemy, second shield -> asteroid, and tutorial shielded asteroid hits now split like live gameplay. `slickLines.ts` shield callouts were updated to match.
- Why: the user reported the HOW TO PLAY shield section felt wonky and the order/asteroid behavior were wrong.
- What didn't work: the old tutorial logic treated any two shield losses as success, so the lesson could complete in the wrong order and the asteroid just vanished instead of fragmenting.
- Next: manually play through the tutorial on desktop and phone-sized viewport to confirm the new pacing feels fair.

---

## Full notes

- Direct user request took priority over the previously active nav-polish plan, so this session intentionally diverged from `docs/plans/2026-04-29 1930 Plan - Unified Top Nav Layout.md`.
- Replaced the shield section's loose counter-based progression with explicit sub-steps:
  - pickup first shield
  - spawn enemy and consume shield on contact
  - spawn second shield
  - spawn asteroid and consume shield on contact
- Cleared lingering drifters/enemies/shields/NPCs at shield-section entry so DANGER leftovers no longer interfere with the lesson.
- Added live-updating objective text for the shield lesson so the player always sees the current required action.
- Copied the live shield-vs-asteroid fragment split math into the tutorial scene so the asteroid demonstrates the same break-apart behavior as the main game.
- `npm.cmd run build` passes.
