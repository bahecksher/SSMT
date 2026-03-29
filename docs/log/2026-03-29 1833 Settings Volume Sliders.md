# 2026-03-29 1833 Settings Volume Sliders

## TL;DR
- What changed: Added persistent music-volume and FX-volume sliders to Menu, MissionSelect, and pause settings, and wired music volume into the live adaptive music mix.
- Why: Volume should be tunable now, and the FX channel needs a saved control ready before sound effects are added later.
- What didn't work: Phaser's broad `GameObject` typing needed a couple of small panel-visibility type adjustments during the build pass.
- Next: Feel-check slider spacing on shorter screens and use the saved FX volume when the first SFX pass lands.

---

## Full notes

Extended `GameSettings` with:
- `musicVolume`
- `fxVolume`

Defaults:
- `musicVolume = 0.7`
- `fxVolume = 1.0`

Implementation details:
- Added a reusable `SettingsSlider` UI helper for consistent slider behavior across screens
- Menu settings now include `MUSIC VOL` and `FX VOL`
- MissionSelect settings now include `MUSIC VOL` and `FX VOL`
- Pause settings now include `MUSIC VOL` and `FX VOL`
- Music volume now scales the live stem mix in the shared `MusicSystem`
- FX volume is saved and surfaced in the UI, but still has no audible effect until SFX are added
- Settings normalization now clamps volume values into the valid `0..1` range when loading or updating saved data

Validation:
- `npm.cmd run build` passed after the changes
