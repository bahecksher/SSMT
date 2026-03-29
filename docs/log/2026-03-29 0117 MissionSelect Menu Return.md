# 2026-03-29 0117 MissionSelect Menu Return

## TL;DR
- What changed: added a direct `MENU` button to MissionSelect so the player can leave the briefing screen without deploying.
- Why: MissionSelect needed an explicit route back to the main menu.
- What didn't work: nothing blocked this pass.
- Next: verify on phone that the new top-left button is visible and easy to tap without crowding the title area.

---

## Full notes

- Added a small top-left `MENU` button in `MissionSelectScene`.
- The button saves the current mission card state and returns directly to `MenuScene`.
- Kept the button separate from the deploy area so backing out and deploying are visually distinct actions.
- Verified the change set with `npm.cmd run build`.
