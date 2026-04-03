# 2026-04-02 2334 Music Default-On Settings Pass

## TL;DR
- What changed: Flipped the music settings default from off to on and bumped the settings version so older saves adopt that default once.
- Why: The user wants music enabled by default now.
- What didn't work: Nothing blocked the change.
- Next: Playcheck first-run audio unlock behavior with the new default-on setting.

---

## Full notes

- Updated `src/game/systems/SettingsSystem.ts`.
- `DEFAULT_SETTINGS.musicEnabled` is now `true`.
- `SETTINGS_VERSION` was bumped from `2` to `3` so older local settings reset `musicEnabled` to the new default once.
- Verified with `npm.cmd run build`.
