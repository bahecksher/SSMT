# 2026-03-27 0137 Remove Death Hit Freeze

## TL;DR
- What changed: Removed the dedicated hit freeze on death so impact now flows straight into the red wipe and result overlay.
- Why: Even after shortening the death wipe hold, the impact still felt like it lingered too long.
- What didn't work: I left the faster death wipe hold in place; this change only removes the extra freeze before that.
- Next: Playtest whether death now feels snappy enough or if the wipe itself should be shortened further.

---

## Full notes

- `GameScene.handleDeath()` no longer enters a temporary `DEATH_FREEZE` pause. It now immediately starts the red wipe transition and then enters the in-scene result overlay.
- This keeps the semi-live result structure intact while removing the extra beat between impact and wipe.
- Extraction flow is unchanged.
- Verification: `npm.cmd run build`
