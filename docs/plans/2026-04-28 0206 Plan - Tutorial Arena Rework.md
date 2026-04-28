# Plan - Tutorial Arena Rework
_Created: 2026-04-28 0206_

## Goal
Replace the current 9-step tutorial with a 5-section walkthrough taught primarily through Slick comm dialog. Each section gives the player time and reps to actually do the thing before advancing.

## Approach

Five sections, in order:

1. **MOVE** — empty arena, player just flies. Advance after distance + min dwell time satisfied.
2. **SCORE** — one salvage debris and one mineable asteroid spawned together. Player must touch both ring types (salvage income > 0 AND mining income > 0) AND a min carry-credit threshold before advance.
3. **DANGER** — drifter (non-mineable) and a single enemy hunter, no shield. Player learns close calls; dying resets the section. Min dwell ~7s before advance (so they can't speed past).
4. **SHIELD** — shield pickup, then drifter + NPC. Player must consume shield against drifter, then pick up another shield, then bump NPC. Both impacts must occur to advance.
5. **EXTRACT** — gate spawns on the right with carry credits already loaded. Wait for live, fly through. Bank ends tutorial.

Slick voice drives the teaching. On-screen text shrinks to a single short objective line ("MOVE THE SHIP") plus the existing score readout. Slick comm fires:
- **Section open**: short setup line.
- **Mid-prompt** at ~3s if objective not met: nudge line.
- **Confirm** on success: short approval and segue to next section.

New `slickLines.ts` keys: `tutMove`, `tutMoveNudge`, `tutMoveDone`, `tutScore`, `tutScoreNudge`, `tutScoreDone`, `tutDanger`, `tutDangerNudge`, `tutDangerDone`, `tutShield`, `tutShieldNudge`, `tutShieldDone`, `tutExtract`, `tutExtractNudge`, `tutExtractDone`, `tutComplete`. Each is an array of one or two lines.

Implementation lives entirely in `TutorialArenaScene.ts` plus a small append to `slickLines.ts`. SlickComm panel pinned to bottom (matches in-game placement) so the tutorial reads like a live op.

## Scope boundaries
- No changes to actual gameplay systems (SalvageSystem, CollisionSystem, ExitGate, etc.).
- No changes to MenuScene or HOW TO PLAY routing — that already lands on TutorialArenaScene.
- Old `HowToPlayScene` left alone (already off the runtime list).
- No survival/endless-wave finale — tutorial ends on extract bank. (Can add later if playtest demands it.)
- Slick line copy is a first pass; tuning expected after playtest.

## Open questions
- Should DANGER section reset to start of section on first death, or end the tutorial? Plan: reset (consistent with rest of tutorial — no "game over" inside teaching).
- Should EXTRACT pre-load credits even if player banked nothing in SCORE? Plan: yes, pad to a fixed amount so the bank readout is satisfying.
