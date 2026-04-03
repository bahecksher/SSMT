# Plan revision - Layered Music System
_Created: 2026-04-02 2340_
_Revises: docs/plans/2026-04-02 2332 Plan revision - Layered Music System.md_

## What changed
- Expand the audio pass beyond background music to include the newly provided gameplay and UI SFX.
- Route menu, MissionSelect, pause, and result interactions through a shared UI select sound.
- Add gameplay event SFX for pickup, shield loss, asteroid collision, bomb detonation, player death, and first enemy entrance.

## Why
- The user supplied the game sound effects and wanted them integrated into both gameplay and menu/pause interaction flows.

## Updated approach
- Preload the provided SFX in Boot and play them through a small shared helper that respects the existing `FX VOL` setting.
- Use `Pick Up` for UI selection in Menu, MissionSelect, pause, and result buttons, plus gameplay shield/bonus pickups.
- Trigger the remaining SFX from focused gameplay hooks rather than scattering raw `sound.play()` calls through the scenes.
