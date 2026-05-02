# 2026-05-01 1927 Four Player Spectate UX

## TL;DR
- What changed: No code changes. Captured recommended viewing UX for 2-4 player Versus.
- Why: User pointed out that watching other player screens becomes hard when the match is not 1v1.
- What didn't work: No implementation attempted.
- Next: Include target-select spectate/sabotage in the eventual 2-4 player Versus plan.

---

## Full notes

Recommendation:

- While alive, do not show all opponent arenas. Show compact opponent status cards with rank, callsign, score, phase, state, and whether they are targeting the player.
- After local death or extraction, switch to a fullscreen spectate view of one selected live target.
- Let the spectator change target from a small list of live players, preferably with a retarget cooldown if sabotage is armed.
- Laser-only sabotage fits this model: the spectator chooses a target, arms/fires a telegraphed lane laser into that target's arena, and the target receives clear warning UI.

This avoids cramming three tiny live mirrors onto mobile and keeps the existing 1v1 fullscreen spectate renderer useful.
