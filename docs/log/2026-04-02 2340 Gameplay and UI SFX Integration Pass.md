# 2026-04-02 2340 Gameplay and UI SFX Integration Pass

## TL;DR
- What changed: Added the provided SFX to gameplay events and reused `Pick Up` for menu, MissionSelect, pause, and result UI selections.
- Why: The user provided the game sounds and wanted the UI to share the pickup click sound.
- What didn't work: `Bomb - Copy.mp3` was not wired because it appears to duplicate `Bomb.mp3`.
- Next: Playcheck the balance between the new SFX and the adaptive music layers.

---

## Full notes

- Copied the provided SFX into `public/audio/`.
- Added `src/game/systems/SfxSystem.ts` and preloaded it from Boot.
- Routed SFX through the existing `FX VOL` setting rather than hard-coding scene-local audio calls.
- Mapped gameplay SFX as follows:
- `Player Death` on death
- `Asteroid Collision` on player asteroid impact
- `Loss of Shields` when the player loses a shield
- `Pick Up` on shield / bonus pickup collection
- `Bomb` on bomb detonation
- `On first enemy appearance` the first time enemies enter a run
- Reused `Pick Up` for Menu, MissionSelect, pause, and result selection clicks.
- Verified with `npm.cmd run build`.
