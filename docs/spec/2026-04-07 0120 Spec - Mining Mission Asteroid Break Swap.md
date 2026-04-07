# Spec - Mining Mission Asteroid Break Swap
_Created: 2026-04-07 0120_

## Goal
Replace the misleading Deepcore `HOLD UNBANKED` mission with a mining-aligned objective that reflects a concrete in-run accomplishment.

## Core change
- Remove the `HOLD {target} UNBANKED` mission from the active mission set.
- Replace it with `BREAK {target} ASTEROIDS` for Deepcore.
- This mission should progress only when the player breaks mineable asteroids.

## Counting rules
- Count asteroid breaks caused by player mining depletion.
- Count asteroid breaks caused by the player's shield destroying or splitting an asteroid on contact.
- Do not count asteroid breaks caused by unrelated board wipes, NPC behavior, or ambient asteroid-on-asteroid collisions.

## Persistence
- Existing saved mission cards using the old hold-contract type should be discarded on load.
- Empty slots created by that discard should be filled with newly generated missions using the current mission pool.

## Out of scope
- Adding a separate pickup-collection mission for NPC/enemy bonus drops
- Retuning the entire mission reward economy
- Changing how mission rewards still depend on successful extraction
