# Plan - Unified Top Nav Layout
_Created: 2026-04-29 1930_

## Goal
Mirror corner button placement, size, and font across Menu, MissionSelect, and VersusLobby so the chrome reads as one product across PC and iPhone 13 mini. Sweep title/CTA scaling at the same time so nothing reflows badly at 375x812 portrait.

## Approach
1. Add `src/game/ui/menuLayout.ts` exporting `getTopNavMetrics(layout)` returning shared `{ leftCenterX, rightCenterX, centerY, width, height, fontSize }` plus `getPrimaryActionY(layout)` for the bottom-anchored CTA. Driven by the existing `isNarrowViewport` / `isShortViewport` breakpoints so iPhone 13 mini portrait shares one path with desktop.
2. MenuScene: route HOW TO PLAY (left) and SETTINGS (right) through the shared metrics; align TAP TO START y to `getPrimaryActionY`.
3. MissionSelectScene: route MENU (left) and SETTINGS (right) through the shared metrics; keep cardMarginX driving content padding. DEPLOY uses `getPrimaryActionY` so Menu and MissionSelect bottom CTA share an anchor line.
4. VersusLobbyScene: route BACK through the shared metrics. (No settings panel exists here yet — deferred.)
5. HowToPlayScene: same BACK alignment so the secondary screen mirrors the primary scenes.
6. Build verify with `npm.cmd run build`.

## Scope boundaries
- No new SETTINGS panel for VersusLobby (defer).
- No HUD / GameScene / TutorialArena chrome changes this pass.
- No content reshuffling inside the leaderboard / job board sections.
- No new palette or font assets.

## Open questions
- Should the bottom action y also unify with VersusLobby's `gameHeight * 0.74` row? Probably not — that screen has a paired button row, not a hero CTA. Leave unchanged unless a follow-up calls for it.
