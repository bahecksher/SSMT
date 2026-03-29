# 2026-03-29 0011 MissionSelect Phone Layout

## TL;DR
- What changed: rebuilt MissionSelect spacing around an adaptive compact layout so the mission cards, favor grid, comm panel, and deploy button all fit shorter phone screens
- Why: fixed-size mission cards were eating too much vertical space and pushing the favor section offscreen on phones
- What didn't work: simply enlarging favor text made the phone-height overflow worse because the scene still assumed a tall viewport
- Next: live-check one short phone viewport to see whether the compact mission cards still feel comfortable to tap

---

## Full notes

- Added a `getBriefingLayoutConfig()` helper in `MissionSelectScene` so the briefing scene scales its vertical spacing from `gameHeight` instead of using one fixed stack.
- Mission cards now use a shorter adaptive height, tighter gaps, and smaller top offsets on compact screens.
- Favor cards also scale down on compact screens, while the lower comm panel now floats above the deploy button instead of reserving permanent empty space.
- Deploy button sizing and hint placement now shrink slightly on compact layouts.
- Verified with `npm.cmd run build`.
