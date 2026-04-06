# 2026-04-06 1308 UI Readability Pass

## TL;DR
- What changed: Increased the shared low-end UI font scaling and made the bottom mission tracker pills taller with larger labels.
- Why: The new readable pixel font still felt too small in practice, especially for the mission tracker below the arena.
- What didn't work: Nothing blocked implementation; the title font treatment stayed unchanged.
- Next: Playtest compact layouts to see whether any specific buttons or panels need follow-up spacing tweaks.

---

## Full notes

- Updated `readableFontSize()` in `src/game/constants.ts` so smaller and mid-sized UI text gets a stronger size boost.
- Enlarged the HUD mission pills in `src/game/ui/Hud.ts` by increasing pill height, label base size, stroke thickness, and wrap spacing.
- Kept the change broad enough to lift readability across the UI while giving the mission tracker the most obvious improvement.
- Verified with `npm.cmd run build`.
