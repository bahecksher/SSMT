# Plan - Layered Music System
_Created: 2026-03-29 1753_

## Goal
Add adaptive background music that layers in cleanly across the current `Menu -> MissionSelect -> Game` flow and intensifies with run progression.

## Approach
- Add three looping music stems to the project audio assets: `synth`, `drums`, and `bass`.
- Create a small audio manager focused on music state, layer volumes, and cross-scene continuity instead of scattering `scene.sound.play()` calls across scenes.
- Load the stems during boot, then start all three loops in sync after the player's first allowed interaction so browser audio restrictions are satisfied.
- Keep loops continuously running once started and drive the mix by muting/unmuting or volume-ramping individual layers. This keeps the stems phase-aligned while the arrangement changes.
- Use scene transitions to set the baseline arrangement:
  - `Menu`: synth only
  - `MissionSelect`: drums only
  - `Game` phase 1-3: drums only
  - `Game` phase 4-5: drums + bass
  - `Game` phase 6+: drums + bass + synth
- Hook the `GameScene` phase-change branch to the music manager so music changes happen in one place when `ExtractionSystem` advances phases.
- Extend saved settings to include at least a music toggle and optional music volume slider so the new system respects player preferences.
- Build and manually test transitions, especially first-run audio unlock, Menu to MissionSelect handoff, retry flow, and phase 3/5 changes.

## Scope boundaries
- No one-shot SFX pass yet.
- No voice-over playback yet.
- No soundtrack authoring or stem editing inside the codebase; assumes the user provides loop-ready files.

## Open questions
- Whether "Mission screen" means `MissionSelect` specifically or the first active gameplay screen after deploy.
- Whether stem transitions should be immediate, short fades, or beat-quantized at bar boundaries.
- Whether the provided stems are already the same BPM, length, and export point so they can loop sample-aligned.
