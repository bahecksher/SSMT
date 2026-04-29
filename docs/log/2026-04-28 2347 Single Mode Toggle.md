# 2026-04-28 2347 Single Mode Toggle

## TL;DR
- What changed: `src/game/scenes/MenuScene.ts` now uses one mode toggle button instead of separate campaign and arcade buttons, while keeping the leaderboard swap tied to the selected mode.
- Why: simplify the menu flow so mode switching is one tap target instead of two separate stacked buttons.
- What didn't work: no build breakages, but I did not do a manual in-browser tap-through pass this session.
- Next: verify both toggle states on the menu, then resume the mirrored versus implementation plan.

---

## Full notes

- Replaced the paired campaign/arcade mode tabs with a single toggle control backed by `SaveSystem.selectedMode`.
- Left the downstream flow alone: tapping into MissionSelect still carries the selected mode forward, and campaign still initializes a session when that mode is launched.
- Kept the menu leaderboard behavior mode-driven instead of creating a second source of truth:
  - `CAMPAIGN` still renders the local campaign leaderboard.
  - `ARCADE` still renders the weekly online `PILOTS` / `CORPS` views.
- `npm.cmd run build` passes after the menu refactor.
