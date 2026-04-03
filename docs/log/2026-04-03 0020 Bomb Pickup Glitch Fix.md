# 2026-04-03 0020 Bomb Pickup Glitch Fix

## TL;DR
- What changed: Player-triggered bomb wipes now `return` out of `GameScene.update()` immediately after `boardWipe(true)`.
- Why: Continuing the same frame after the wipe could iterate a now-cleared `bombPickups` array and also let post-wipe update work repopulate the field.
- What didn't work: Leaving the old `continue` in place after `boardWipe(true)` was unsafe once bombs could coexist on the field.
- Next: Playtest the multi-bomb case in-game to confirm the wipe stays visually clean and stable.

---

## Full notes

Short regression fix outside the active layered-music plan. I followed the existing plan context, but this session intentionally diverged to address a gameplay glitch reported on bomb collection.

The issue was in `GameScene`'s bomb pickup loop. When the player collected a bomb, the code removed the current pickup, called `boardWipe(true)`, and then continued the loop. `boardWipe(true)` clears `this.bombPickups`, so if more than one bomb existed the next loop iteration could read an emptied array. Even when it did not throw, the rest of `update()` could continue after the wipe and run additional simulation work in the same frame.

The fix keeps the change small: after the player-triggered bomb wipe, `GameScene.update()` now exits immediately via `return`.

Verification:
- Ran `npm.cmd run build` successfully on the updated worktree.
