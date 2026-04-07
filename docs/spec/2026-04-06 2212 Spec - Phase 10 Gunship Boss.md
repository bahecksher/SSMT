# Spec - Phase 10 Gunship Boss
_Created: 2026-04-06 2212_

## Goal
Add a phase-10 Regent boss encounter built around a sliding edge gunship with destroyable laser guns, an exposed core phase, and a heavy debris aftermath.

## Requirements
- A Regent gunship boss should begin appearing once the run reaches phase 10.
- The boss should hug one edge of the arena and slide along that edge instead of steering through open space like normal enemies.
- The boss carries multiple laser guns that project inward laser threats while those guns are alive.
- The guns must be destroyable by ramming them with an active player shield, following the same shield-consumed collision language as enemy rams.
- After roughly 10-15 seconds on one edge, the gunship should leave that pass and reappear on another random edge while preserving however many guns remain alive.
- Once every gun is destroyed, the boss should expose a vulnerable core.
- The core phase should require a shielded player to fly into the exposed core and back out to destroy the boss.
- Destroying the boss should create a large debris field that the player still has to survive and navigate around.

## Out of scope
- A separate boss scene or cinematic transition
- New backend or save-data features tied to boss completion
- A full narrative rewrite outside the lines needed to support the encounter
