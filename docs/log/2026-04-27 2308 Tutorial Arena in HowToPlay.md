# 2026-04-27 2308 Tutorial Arena in HowToPlay

## TL;DR
- What changed: Added a new `TutorialArenaScene` and launched it from a new `TUTORIAL ARENA` button inside `How To Play`.
- Why: The user wanted a slow, hands-on onboarding arena that teaches the real game loop step by step instead of relying on text only.
- What didn't work: No browser playtest yet, so pacing and clarity are build-verified only.
- Next: Run the tutorial end-to-end in the browser and tune any step that feels too abrupt, too vague, or too punishing.

---

## Full notes

- Added a dedicated tutorial scene that reuses the real player, salvage, asteroid, shield, NPC, enemy, gate, input, scoring, and collision systems instead of faking the mechanics.
- Scripted the tutorial flow as a sequence:
  - movement confirmation
  - salvage ring
  - asteroid mining ring
  - NPC salvager intro
  - shield pickup
  - shield vs asteroid
  - shield vs NPC
  - enemy intro
  - extraction gate banking
  - endless enemy spawns until tutorial death
- Added per-step reset handling so pre-final mistakes restart the current lesson instead of dumping the player out of the tutorial.
- Added a centered `TUTORIAL ARENA` button to `HowToPlayScene` and preserved the guide page index when returning from the tutorial.
- Registered the new scene in `constants.ts` and `config.ts`, and added `ScoreSystem.reset()` so the full tutorial can restart cleanly from the completion overlay.
- `npm.cmd run build` passes after the tutorial scene and guide integration.
