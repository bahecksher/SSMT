# 2026-04-02 2350 Asteroid-vs-Asteroid Collision SFX Fix

## TL;DR
- What changed: Wired `Asteroid Collision` into asteroid-on-asteroid impacts inside `DifficultySystem`.
- Why: The sound had only been attached to player-hit paths, so drifters colliding with each other stayed silent.
- What didn't work: Nothing blocked the fix.
- Next: Playcheck the collision mix to make sure the new sound is audible without becoming too repetitive.

---

## Full notes

- Updated `src/game/systems/DifficultySystem.ts`.
- Added the asteroid collision SFX to `resolveDrifterCollisions()` so hazard-on-hazard impacts now trigger audio.
- Added a short cooldown so clustered collisions do not spam the sound every frame.
- Verified with `npm.cmd run build`.
