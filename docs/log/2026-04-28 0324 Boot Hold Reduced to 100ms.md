# 2026-04-28 0324 Boot Hold Reduced to 100ms

## TL;DR
- What changed: reduced `BOOT_MIN_DISPLAY_MS` in `BootScene` from `450ms` to `100ms`.
- Why: user wanted the forced boot hold cut down further so startup gets out of the way almost immediately.
- What didn't work: nothing blocked this pass; it was a simple tuning follow-up on the startup optimization work.
- Next: cold-refresh on phone and confirm the nearly instant handoff still feels stable instead of glitchy.

---

## Full notes

### Files changed
- `src/game/scenes/BootScene.ts`
- `docs/state.md`
- `docs/log/2026-04-28 0324 Boot Hold Reduced to 100ms.md`

### What works
- Boot now waits only `100ms` before the menu handoff floor can be satisfied.
- The lighter boot audio path and removed font gate from the prior pass are unchanged.
- `npm.cmd run build` passes.

### What is still stubbed
- No real-device cold-refresh validation yet on whether `100ms` is visually stable on slower phones.

### Risks / follow-ups
- If the boot screen now flashes too quickly or feels glitchy on very fast loads, the best compromise is likely somewhere between `100ms` and `250ms`.
