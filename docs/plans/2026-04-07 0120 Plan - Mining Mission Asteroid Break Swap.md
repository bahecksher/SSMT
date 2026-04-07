# Plan - Mining Mission Asteroid Break Swap
_Created: 2026-04-07 0120_

## Goal
Swap the misleading Deepcore hold-credit mission for a real asteroid-break objective.

## Approach
- Add a `BREAK_ASTEROIDS` mission type and update Deepcore's secondary mission card copy and tier targets.
- Track player-caused asteroid breaks from mining depletion and shield rams.
- Remove the old hold-credit mission from runtime tracking and HUD/brief text.
- Filter legacy saved mission cards that still use the old hold-credit type.
- Verify the change set with `npm.cmd run build`.

## Scope boundaries
- No new mission slot count or reroll behavior
- No redesign of reward payout timing
- No new NPC/enemy bonus-drop mission in this pass

## Open questions
- Whether a later pass should add a separate objective for collecting bonus pickups from destroyed NPCs/enemies
