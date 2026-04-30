# State
_Last updated: 2026-04-29 2247_

## Current focus
Documentation handoff cleanup. `AGENTS.md` now keeps logs as an archive while avoiding automatic full-history context loads.

## What's working
- `AGENTS.md`:
  - startup now reads `state.md`, skims/searches `decisions.md` only as needed, checks active plans, and opens only linked logs
  - docs tree and examples use ASCII-safe punctuation
- `docs/decisions.md`:
  - header now tells agents to skim/search instead of loading the whole growing file by default
- `src/game/scenes/TutorialArenaScene.ts`:
  - tutorial header shows section title only
  - Slick gives an intro during the entry-warp wait
  - tutorial-only comms stay up longer for readability
  - shield lesson teaches enemy first, asteroid second
  - shielded asteroid hits split like live gameplay
- `src/game/data/slickLines.ts`:
  - shield tutorial comms explicitly say enemy first, asteroid second
  - tutorial intro line added for the gate-drop wait
- `src/game/scenes/MenuScene.ts`:
  - corporation board keeps the full four-corp standings
  - donut chart sits with more breathing room above the rows
  - corporation rows use fixed rank / name / score columns
  - corporation names and scores now sit closer together after two tightening passes
- `npm.cmd run build`: passes.
- `origin/main`: synced with the wrapped session state after docs push.

## In progress
- Nothing in flight - documentation cleanup wrapped.

## Known issues
- Tutorial surfaces still need a live feel-check:
  - intro handoff into `MOVE`
  - longer comm timeout on compact phone-sized viewport
  - shield lesson pacing with random edge spawns
- Corporation board still needs a live visual check on compact phones to confirm the donut gap and tightened columns feel balanced above Slick's comm panel.
- TutorialArenaScene BACK still sits top-right, not aligned to the shared top-left corner pattern.
- Versus mirror framerate fix is still build-verified only; no fresh phone verification.
- Versus flow still needs a fresh two-window manual playtest after the cumulative chrome / spectate / framerate changes.
- Spectate lane buttons still sit on arena edges and may crowd ships or hazards.
- Manual Supabase SQL migration for `mode` / `company_id` columns still pending (`docs/sql/2026-04-28 1403 mode and company_id columns.sql`).
- Soft respawn keeps rep-flux income accumulators across lives.
- Rep-flux tuning placeholders remain in `tuning.ts`.

## Next actions
1. Live HOW TO PLAY pass on desktop and iPhone 13 mini-sized viewport:
   - Slick intro during entry wait
   - no `STEP #/#`
   - comm timing feels readable
   - shield lesson still resolves enemy first, asteroid second
2. Live main-menu `CORPS` pass on desktop and iPhone 13 mini-sized viewport:
   - donut/row spacing feels right
   - fixed columns feel uniform
   - names/scores no longer feel too spread out
3. Resume the outstanding versus/mobile manual verification work next session.

## Active plan
docs/plans/2026-04-29 2150 Plan revision - Tutorial Arena Intro and Comms.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run dev`
3. Launch `HOW TO PLAY` and confirm:
   - Slick intro appears during the entry gate / warp wait
   - the top-center header shows only the section title
   - tutorial comms remain visible long enough to read comfortably
   - shield lesson still runs enemy first, asteroid second
4. Open the main menu, switch to `CORPS`, and confirm:
   - more space between the donut chart and corporation rows
   - uniform fixed rank / name / score columns
   - corporation names and scores feel tighter than the first fixed-column pass

## Recent logs
- docs/log/2026-04-29 2247 Documentation Handoff Cleanup.md - clarified agent startup context rules and kept logs as linked archive material.
- docs/log/2026-04-29 2153 Session Wrap Tutorial and Menu Polish.md - session wrap covering tutorial onboarding/comms polish and corporation board layout cleanup.
- docs/log/2026-04-29 2150 Tutorial Header and Intro Comms.md - removed the tutorial step counter, slowed tutorial comm fade timing, and added a pre-spawn Slick intro.
