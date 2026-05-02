# 2026-05-01 1916 Four Player Versus Direction

## TL;DR
- What changed: No code changes. Captured clarified direction for 2-4 player Versus.
- Why: User confirmed they do not want a shared arena; they want high-score/extract competition plus sabotage after death.
- What didn't work: No implementation attempted.
- Next: Write/implement a focused plan when ready.

---

## Full notes

User clarified the desired multiplayer expansion:

- Keep separate local arenas, not shared physics.
- Expand current 1v1 Versus to rooms with up to four players.
- Main competition is high score plus extraction.
- Eliminated players should be able to sabotage another live player.
- Repulsors may need to be pared down; laser-only sabotage is likely the cleaner first version for 2-4 player rooms.

Design recommendation: start with laser-only spectator sabotage for multi-player rooms. It is easier to target, easier to read in the mirror/spectate UI, and avoids compounding force/position edge cases from multiple dead players placing repulsors into live arenas.
