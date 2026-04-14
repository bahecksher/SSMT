# Plan revision - Startup Loading Performance
_Created: 2026-04-13 2341_
_Revises: docs/plans/2026-04-09 0116 Plan revision - Startup Loading Screen.md_

## What changed
- Shortened the boot scene's mandatory hold so the menu can appear much sooner after critical assets are ready
- Removed the large late-game music WAV stack from the boot-time critical path
- Added background warming for later layered music and deferred full-phase tracks until the run is close to needing them

## Why
- Cold-start latency was dominated by preloading roughly 175 MB of music before the menu could open
- The previous 4 second minimum display made startup feel slower even when the core experience was already ready

## Updated approach
- Keep the current boot visuals, font handoff, and loading presentation
- Preload only the menu and early gameplay music layers plus existing SFX during boot
- Warm mid-game music once Menu, Mission Select, or Game scenes are active
- Queue the large full-phase tracks only when the player is near the late-game transition instead of on first load
