# 2026-03-29 1836 Music Default-Off Migration

## TL;DR
- What changed: Added a one-time settings migration that resets music to off for older saved settings so the beta music feature no longer auto-starts on existing installs.
- Why: Changing the default to off was not enough by itself because previous local settings could still persist `musicEnabled: true`.
- What didn't work: Nothing major; this was a targeted settings persistence fix.
- Next: Confirm the next app load starts with music off, then keep using the existing toggle when music is explicitly enabled for testing.

---

## Full notes

Updated `SettingsSystem` to include a saved settings version.

Behavior:
- fresh installs still default to `musicEnabled = false`
- older saved settings are migrated once
- during that migration, music is forced back to the current default (`off`)
- after migration, the user can still turn music on manually and have that preference persist normally

This specifically addresses the case where the user had an older save that still contained `musicEnabled: true`, which made MissionSelect appear to ignore the new default-off behavior.

Validation:
- `npm.cmd run build` passed after the migration change
