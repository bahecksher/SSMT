# Plan revision - Startup Loading Performance
_Created: 2026-04-28 0318_
_Revises: docs/plans/2026-04-13 2352 Plan revision - Startup Loading Performance.md_

## What changed
- Reduce the boot-time music set again so startup only blocks on menu + earliest gameplay stems.
- Remove the boot-to-menu font gate and shorten the forced boot-screen hold.
- Reintroduce deferred gameplay-stem warming, but align late-loaded stems to the currently running gameplay stem instead of letting them free-run out of phase.

## Why
- Phone startup still feels too slow, and current boot is front-loading much more audio than the menu needs.
- The earlier “load everything at boot” sync fix solved phase 3→4 timing, but it regressed first-load performance on slower devices.

## Updated approach
Only preload `menuSynth`, `bassOne`, and `drumsTwo` during boot.
Warm `drumsThree`, `bassThree`, and `gameSynth` in Menu / MissionSelect / Game after the menu is already visible.
When those later stems finish loading, start them at the gameplay reference stem's current seek position so phase transitions stay aligned.
Let boot fonts continue loading opportunistically, but do not hold the menu hostage waiting for them.
