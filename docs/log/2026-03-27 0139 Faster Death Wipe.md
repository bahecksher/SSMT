# 2026-03-27 0139 Faster Death Wipe

## TL;DR
- What changed: Accelerated the death wipe animation to `350ms` with a `120ms` hold before the result overlay appears.
- Why: Even after removing the hit freeze, the death transition still felt slow.
- What didn't work: I left extraction timing alone so only the death path changed.
- Next: Playtest whether the death pacing now feels snappy enough, or whether the wipe should be even more abrupt.

---

## Full notes

- `GameScene.handleDeath()` now calls `Overlays.screenWipe()` with a faster death-specific timing override.
- The semi-live result structure is unchanged: only the death wipe cadence was tightened.
- Extraction continues using the default wipe timing.
- Verification: `npm.cmd run build`
