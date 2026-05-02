# Plan - Four Player Versus Expansion
_Created: 2026-05-01 1928_

## Goal
Expand Versus from strict 1v1 into 2-4 player parallel-arena competition. Players keep separate local arenas, compete on score plus extraction, and terminal players can sabotage selected live players.

## Approach
1. Roster foundation
   - Add 2-4 player room helpers to `NetSession`.
   - Update the main-menu Versus lobby copy/UI to understand room slots instead of one opponent.
   - Keep 3-4 player launch blocked until downstream systems stop assuming one peer.

2. Direct deploy foundation
   - Remove MissionSelect from the Versus route.
   - Keep Versus plain: no missions, no company affiliation boosts, no liaison.
   - Launch straight from room ready/countdown into `GameScene`.

3. Runtime foundation
   - Stamp every snapshot, terminal event, and sabotage event with `senderId`.
   - Replace single peer snapshot/outcome state with maps keyed by player id.
   - Keep local arena full-screen while alive; show compact ranked status cards for other players.

4. Terminal spectate and sabotage
   - After extract/death, choose one live target to spectate fullscreen.
   - Start with laser-only sabotage and remove/disable repulsor use in 3-4 player rooms.
   - Add target warnings for the live player being attacked.

5. Results
   - Rank extracted players above destroyed players.
   - Sort extracted players by score, then time if needed.
   - Show 2-4 player result table and rematch readiness.

## Scope boundaries
- No shared arena or shared physics.
- No simultaneous multi-screen opponent wall during live play.
- No repulsors in 3-4 player rooms for the first multiplayer expansion.
- No ranked online ladder for 2-4 player Versus in this pass.
- No missions, favor purchases, or company flight contracts in Versus.

## Open questions
- Should death sabotage target be free-select, leader-only, or cooldown-gated free-select?
- Should extracted players also get sabotage, or only destroyed players?
- Should four-player rooms allow launch with 2 or 3 players, or require full 4 once more than 2 have joined?
