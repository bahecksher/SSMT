# 2026-04-27 2333 Direct How-To Arena Launch

## TL;DR
- What changed: the main-menu `HOW TO PLAY` button now launches `TUTORIAL ARENA` directly, and tutorial back actions now return straight to the main menu.
- Why: the user wanted the old tutorial text guide removed from the flow so `HOW TO PLAY` goes straight into hands-on learning.
- What didn't work: nothing blocked the change; this pass is build-verified only.
- Next: browser-playtest the direct launch and confirm the arena back button plus `Esc` both feel right now that the intermediate guide screen is skipped.

---

## Full notes

- Updated `src/game/scenes/MenuScene.ts` so the `HOW TO PLAY` button starts `SCENE_KEYS.TUTORIAL_ARENA` directly.
- Updated `src/game/scenes/TutorialArenaScene.ts` so its top-left back button, completion overlay back button, and `Esc` shortcut all return to `SCENE_KEYS.MENU`.
- Removed the now-unused page-return breadcrumb from `TutorialArenaScene`.
- Removed `HowToPlayScene` from the registered scene list in `src/game/config.ts`, so the old text guide is no longer part of the live scene flow.
- Ran `npm.cmd run build` successfully after the change.
