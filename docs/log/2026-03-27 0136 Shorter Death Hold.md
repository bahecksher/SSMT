# 2026-03-27 0136 Shorter Death Hold

## TL;DR
- What changed: Shortened the post-wipe hold on death so the `DESTROYED` overlay appears faster after the impact.
- Why: The death sequence already had a brief hit freeze, so the extra hold after the red wipe was making the transition feel slower than intended.
- What didn't work: I only adjusted the death path; extraction timing was left alone on purpose.
- Next: Playtest whether the new death pacing feels readable without feeling abrupt.

---

## Full notes

- `Overlays.screenWipe()` now supports optional timing overrides instead of using one fixed duration/hold pair for every use.
- `GameScene` uses a shorter `hold: 250` for the death wipe, while extraction continues using the default timing.
- The original 250ms hit freeze remains unchanged, so the player still gets a moment to register the impact location before the faster transition into the result overlay.
- Verification: `npm.cmd run build`
