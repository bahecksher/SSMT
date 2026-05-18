# 2026-05-18 1230 Rival Debug Shortcut

## TL;DR
- What changed: Added a debug rival spawn shortcut and devtools hook.
- Why: Rival behavior needs quick manual testing without waiting for phase/chance timing.
- What didn't work: The sandboxed build hit the Vite temp-file permission issue again; the escalated build passed.
- Next: Use `Shift+R` during a run to force Redline and tune spawn/combat feel.

---

## Full notes

Added:
- `Shift+R` debug shortcut to force-spawn the current rival.
- `window.bitpSpawnRival()` devtools hook.
- `DifficultySystem.debugSpawnRival()` helper.

Behavior:
- Blocks score recording like the other debug helpers.
- Does nothing in Versus, pocket mode, or non-gameplay states.
- If a rival is already active, shows `DEBUG // RIVAL ALREADY ACTIVE`.

Verification:
- `npm.cmd run build` passed after rerunning outside the sandbox.
