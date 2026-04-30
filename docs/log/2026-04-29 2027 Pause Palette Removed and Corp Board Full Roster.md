# 2026-04-29 2027 Pause Palette Removed and Corp Board Full Roster

## TL;DR
- What changed:
  - Removed the PALETTE swap button (and its surrounding row + dead `applyActivePalette` / `refreshCountdownPalette` methods + unused `getNextPaletteId` / `PALETTE_LABELS` / `PaletteId` imports) from the in-game pause menu in `GameScene.ts`. Music row now sits directly under SCAN.
  - Stripped the `*BETA*` tag from the music row in `GameScene.ts` (pause menu), `MenuScene.ts` (main menu settings panel), and `MissionSelectScene.ts` (mission select settings panel). Settings panel ui arrays trimmed to match.
  - Corp leaderboard in `MenuScene.renderCorporationLeaderboard` now always renders all four corps. Added `buildFullCorpEntries` helper that backfills any missing companies with zero-score rows so a corp never disappears from the board (or from the donut graph) just because no runs are attributed to it yet. Removed the `Math.min(4, ...)` row cap that could trim rows on tight viewports.
- Why:
  - Palette switching is still available in the menu / mission select settings panels — duplicating it inside the pause menu was clutter the user wanted to drop.
  - Music feature is no longer beta-flagged.
  - User asked to see all four corps on the corp leaderboard regardless of run distribution.
- What didn't work: nothing — first build pass surfaced one unused `refreshCountdownPalette` (the only remaining caller was the deleted palette button); removed it and rebuild passed.
- Next: live phone/desktop pass to confirm the corp leaderboard with all four corps still leaves room for the Slick comm panel below, and the pause menu reflows cleanly without the palette row.

---

## Full notes

### Files changed
- `src/game/scenes/GameScene.ts`:
  - Imports trimmed: dropped `getNextPaletteId`, `PALETTE_LABELS`, `type PaletteId`.
  - Pause settings layout: dropped `paletteY`; `musicY = scanY + settingRowGap` (one row tighter).
  - Removed the entire palette button block (bg, label, hit zone, click handler).
  - Removed the `*BETA*` text under the music row.
  - Deleted `applyActivePalette` (no remaining callers) and the orphaned `refreshCountdownPalette` (only called from the deleted palette path).
- `src/game/scenes/MenuScene.ts`:
  - Removed the `*BETA*` label from the settings panel music row and from the `settingsPanelUi` array.
  - Imported `COMPANY_IDS` alongside `COMPANIES`.
  - `renderCorporationLeaderboard` builds a 4-corp array via the new `buildFullCorpEntries` helper, passes it to both the donut graph and the row renderer, and removes the row cap so all four corps print.
  - Added `buildFullCorpEntries` private method that maps incoming entries by companyId, fills in zero-score placeholders for any missing corps, and sorts by totalScore / bestScore / runCount.
- `src/game/scenes/MissionSelectScene.ts`:
  - Removed the `*BETA*` label from the settings panel music row and from the `settingsPanelUi` array.

### Verify
1. `npm.cmd run build` — passes.
2. `npm.cmd run dev`, open menu, switch to corp leaderboard view: confirm all four corps render, including any with 0 runs (rendered as zero-score rows).
3. Start a run, hit pause: confirm SHAKE / SCAN / MUSIC rows are present without the PALETTE button between SCAN and MUSIC, and without the `*BETA*` tag under MUSIC.
4. Open settings panels in main menu and mission select: confirm music row no longer carries the `*BETA*` tag.

### Out of scope
- Palette swap is still wired in main menu + mission select settings panels.
- Corp leaderboard layout still keys off the existing constrained viewport metrics; if four rows + the donut crowd Slick on a very small viewport, that's a follow-up tuning pass.
