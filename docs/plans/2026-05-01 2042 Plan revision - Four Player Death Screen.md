# Plan revision - Four Player Death Screen
_Created: 2026-05-01 2042_
_Revises: docs/plans/2026-05-01 1928 Plan - Four Player Versus Expansion.md_

## What changed
- Preserve the current 1v1 Versus death/spectate/laser experience.
- For 3-4 player rooms, replace "the" death broadcast view with a live scoreboard-first terminal screen.
- Show live score, phase, and terminal state for every pilot while any players remain alive.
- Let terminal players select one live target to spectate/sabotage rather than assuming one opponent.

## Why
- In 3-4 player rooms, one full-screen broadcast cannot represent every surviving player fairly.
- Showing all arenas at once is too small and noisy, especially on mobile.
- Real-time score/phase/status is already compatible with the snapshot model and gives dead players meaningful match context.

## Updated approach
- Keep 1v1 path mostly unchanged:
  - Existing mirror/death screen stays.
  - Existing lasers stay.
  - Existing rematch/result feel stays unless a bug fix is needed.
- Add a separate 3-4 player terminal screen:
  - Ranked live table: callsign, score, phase, state, extracted/dead/alive.
  - Highlight current leader and local player.
  - Show "watch" / "target" control for each alive player.
  - Spectate one selected target fullscreen when chosen.
  - Laser sabotage targets only the selected live player.
- Feed the table from sender-keyed snapshots and terminal events.
- Keep the local arena full-focus while alive; use compact opponent cards, not live mini-arenas.

## Fair sabotage notes
- Prefer laser-only sabotage for 3-4 player rooms.
- Use visible warnings for the target.
- Use charge/cooldown limits and one selected target at a time.
- Consider catch-up weighting: dead players can target anyone, but leader-targeting should be easy and obvious.
- Avoid stacked unavoidable punishment: either limit simultaneous incoming lasers per target or queue/space them.
