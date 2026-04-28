# 2026-04-28 0206 Tutorial Arena Rework

## TL;DR
- What changed: replaced the 9-step tutorial with a 5-section walkthrough (MOVE, SCORE, DANGERS, SHIELDS, EXTRACT) taught through Slick comm dialog. Each section gates advance on the player actually performing the lesson, not just appearing in frame. Added 16 new tutorial-specific Slick line keys.
- Why: the prior tutorial advanced too fast, didn't give the player time to do the thing being taught, and leaned on dense on-screen step text instead of in-character voice. User asked for a tighter five-beat structure delivered via Slick.
- What didn't work: the SHIELD section originally had a single phase (one shield, one impact). It conflated the lesson — switched to a two-phase flow (drifter impact -> respawn shield + NPC -> NPC impact) so the player sees the shield work against both hazard types separately.
- Next: browser playtest, then tune section thresholds (`MOVE_MIN_DISTANCE`, `DANGER_SURVIVE_MS`, `SCORE_MIN_CARRY`) and Slick line copy.

---

## Full notes

### Files changed
- `src/game/scenes/TutorialArenaScene.ts` — full rewrite of the section orchestration. Swapped the 9-entry `TutorialStepId` union for a 5-entry `SectionId` union (`move`, `score`, `danger`, `shield`, `extract`). Replaced the on-screen `statusText` with a bottom-pinned `SlickComm` panel; section openers, mid-objective nudges, reset notices, and the completion line all flow through `getSlickLine()`. Per-section gating:
  - `move`: advance after `MOVE_MIN_DISTANCE` 240px AND `MOVE_MIN_TIME_MS` 4000ms.
  - `score`: advance after both ring types touched (`salvageTouched`, `miningTouched`) AND carry >= 30c, sustained for 1500ms.
  - `danger`: advance after surviving 7500ms with no shield. Death resets the section.
  - `shield`: advance after a drifter impact under shield AND an NPC impact under shield. After the drifter impact, a second shield and an NPC spawn automatically.
  - `extract`: pre-load 60c carry if needed, spawn gate with 2200ms preview + 60s live window, finish on bank.
- `src/game/data/slickLines.ts` — added 18 keys to `SlickLineKey` and matching line arrays in `SLICK_LINES`. Used `getSlickLine()` everywhere in the scene.

### Files created
- `docs/plans/2026-04-28 0206 Plan - Tutorial Arena Rework.md`

### What works
- `npm run build` is clean (tsc + vite).
- Section gating logic is data-driven by the constants block at the top of the scene, so playtest tuning is a one-line change per knob.
- The completion overlay still offers RESTART and BACK TO MENU.
- `Esc` and `R` keybindings still map to menu and reset-section.

### What is still stubbed
- Slick line copy is a first pass — written in voice but not playtested.
- No section 6 / endless survival finale. Tutorial ends on extract bank.

### Risks / follow-ups
- The bottom-pinned Slick panel may overlap action on very short viewports. May need to lift the arena spawn or shrink the panel on compact layouts.
- The DANGERS section's hunter is the standard `EnemyShip` which spawns via its own constructor without a fixed position — if the spawn lands too close to the player it could feel unfair. Worth watching in playtest; can be swapped for a fixed-position spawn helper if needed.
- The shield phase machine doesn't handle the player walking off the second-phase NPC for too long. If it becomes a stall, add a re-prompt after a delay.
