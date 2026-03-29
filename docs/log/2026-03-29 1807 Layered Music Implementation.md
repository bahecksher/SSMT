# 2026-03-29 1807 Layered Music Implementation

## TL;DR
- What changed: Added the first adaptive music pass with synced synth/drums/bass stems, scene-based mixing, phase-based layering, and a persistent music toggle in settings.
- Why: The game now has a real tonal ramp instead of silence, matching the current `Menu -> MissionSelect -> Game` flow and late-phase escalation.
- What didn't work: Phaser's generic sound typing needed a narrower concrete sound union before the build would pass.
- Next: Playtest the stem balance, first-interaction unlock behavior, and whether the phase 4 / phase 6 entrances want softer or longer fades.

---

## Full notes

Copied the user-provided MP3 stems from Downloads into `public/audio/` with clean runtime names:
- `phase-lock-synth.mp3`
- `phase-lock-drums.mp3`
- `phase-lock-bass.mp3`

Added `src/game/systems/MusicSystem.ts` as a small global music mixer:
- preloads the three stems in Boot
- keeps a single synced set of loop instances alive across scene changes
- uses volume mixing instead of stopping/restarting tracks
- maps gameplay phases to the intended arrangement:
  - Menu = synth only
  - MissionSelect = drums only
  - phase 1-3 = drums only
  - phase 4-5 = drums + bass
  - phase 6+ = synth + drums + bass

Hooked music into:
- `BootScene` preload
- `MenuScene` create
- `MissionSelectScene` create
- `GameScene` create and phase-advance handling

Extended saved settings with `musicEnabled` and exposed the toggle in both:
- Menu settings popover
- in-run pause settings

Validation:
- `npm.cmd run build` passed after the music changes

Open feel-check items:
- Whether the first menu tap should continue to deploy immediately if audio was previously blocked by browser autoplay rules
- Whether the synth stem is too dominant when it returns at phase 6
- Whether the phase-change fades should be longer or beat-quantized later
