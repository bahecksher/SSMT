# 2026-03-27 0107 Slick Comms Rework and Live Menu

## TL;DR
- What changed: Reworked Slick comms overlay (AI face, top-center, gate-only in game), added live phase-1 background to menu with seamless handoff into gameplay, added how-to-play text, added runStart and gateClose lines
- Why: User wanted comms repositioned and redesigned, menu felt static, needed smoother game entry and brief instructions
- What didn't work: Nothing major — clean implementation across all changes
- Next: Deploy to GitHub Pages, playtest on mobile, audio/settings screen

---

## Full notes

### Slick comms rework
- Moved comms panel from bottom-left to top-center of screen (y=12, horizontally centered)
- Replaced moustache character portrait with geometric AI face: hexagonal outline, circuit traces, bar eyes, equalizer mouth, scan line
- Added subtle scan rotation tween for liveliness
- Panel slides down from top on show, up on hide
- Removed Slick from MenuScene and GameOverScene entirely
- In GameScene: removed runStart, shieldPickup, phaseAdvance, death, extraction triggers
- Kept only gateOpen trigger initially

### Slick lines restored/added
- Re-added runStart line on game start
- Added gateClose event: 50% chance Slick comments when player lets a gate close ("Make mama proud.", "Greedy. I like it.", etc.)
- gateClose lines auto-hide after 2.4s (shorter than default)

### Live menu background
- Menu now runs a phase-1 simulation behind the UI: starfield, drifting salvage debris (up to 2), drifter asteroids (up to 5), hologram overlay
- Semi-transparent dark panel behind menu text for readability
- All UI elements set to depth 10+ so they render above the simulation

### Seamless game start
- On tap-to-start, menu snapshots all active drifter and debris positions/velocities/sizes
- Passes snapshot as data to GameScene via scene.start()
- GameScene recreates entities at their exact positions using DrifterHazard.createFragment() and new SalvageDebris.createAt() factory
- Player drops into the same field they were watching

### How to play
- Added three-line instruction block on menu: "COLLECT SALVAGE FOR CREDITS / DODGE ASTEROIDS & HAZARDS / EXTRACT AT THE GATE TO BANK"

### Commits
- bbbbe18: leaderboard, Slick comms, live menu background, seamless game start
- 81d4a04: runStart and gateClose Slick lines
