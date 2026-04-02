# 2026-04-02 1659 MissionSelect Living Background

## TL;DR
- What changed: MissionSelect now rebuilds and updates the same living background layer used by the main menu, and Menu/MissionSelect now pass the current background snapshot forward so transitions stay visually continuous
- Why: The static MissionSelect backdrop broke the alive feel of the menu once the user moved into the favor/briefing screen
- What didn't work: No live device/browser playcheck yet this session; verification was limited to `npm.cmd run build`
- Next: Visually sweep Menu -> MissionSelect -> Game and MissionSelect -> Menu transitions for continuity, readability, and density

---

## Full notes

- Replaced MissionSelect's static starfield-only background with the same style of overscanned starfield, geo-sphere, drifting salvage debris, drifters, and NPC ships used on the main menu.
- Reconstructed carried-over background entities from the existing menu handoff instead of reseeding from scratch when state was provided.
- Added background simulation updates inside MissionSelect so debris depletes, NPCs retarget salvage, hazards cull NPCs, and replacement entities respawn over time just like the menu backdrop.
- Switched MissionSelect deploy handoff to capture the current live background state before entering gameplay, which prevents long briefing pauses from causing a visible snap when the run starts.
- Extended MenuScene to accept an optional background handoff too, so backing out of MissionSelect can restore the living background rather than always restarting from a fresh seed.
- Verified with `npm.cmd run build`.
