# 2026-04-02 1806 Restore Original Arena Dimensions

## TL;DR
- What changed: Removed the gameplay-only layout inset override from `GameScene`, so the arena uses the original/default dimensions again
- Why: The temporary reserved gameplay framing made the arena feel worse than the previous layout
- What didn't work: The symmetric top/bottom reserve and expanded bottom gameplay lane were both too invasive for the desired feel
- Next: Playcheck the restored arena framing with bottom-pinned comms on a phone-sized viewport

---

## Full notes

Reverted the `setLayoutSize(..., { topInsetOverride, bottomInsetOverride })` usage in `GameScene.create()` and returned the scene to the default `setLayoutSize(width, height)` path.

Left the newer comm behavior intact: gameplay comms still anchor to the bottom, and mission pills still hide while a gameplay comm is visible so the comm channel can take that lane when needed.

Validation: `npm.cmd run build`
