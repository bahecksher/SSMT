# State
_Last updated: 2026-05-01 0208_

## Current focus
Multiplayer spectate readability: make spectator-fired pulsar/repulsor hits visible on the death/spectate screen.

## What's working
- Main menu mode cycling still supports Arcade, Campaign, and Versus.
- Versus mode no longer shows the old "1V1 mirrored lobby // no leaderboard yet" placeholder.
- Versus mode no longer shows the bottom "ROOM SETUP ABOVE" prompt.
- When Versus is selected, the main menu now renders CREATE/JOIN room controls in the leaderboard area.
- Versus countdown now renders in the bottom action area instead of over the room code/opponent text.
- The in-menu Versus flow carries over the prior lobby behavior: generated room codes, join prompt validation, waiting for opponent, ready/unready, cancel, host countdown, and handoff into Mission Select with `mode: RunMode.VERSUS`.
- Tapping the general background while Versus is selected no longer opens the separate Versus lobby scene.
- Spectator-fired repulsor/pulsar charge markers now promote above the death-screen mirror so the dead player can see where the hit is arming/detonating.
- `npm.cmd run build` passes.

## In progress
- No code left half-done.

## Known issues
- The old `VersusLobbyScene` still exists in the scene list but is no longer entered from the main menu. It may be removable later after a full two-window verification pass.
- Main menu embedded Versus room UI needs a live compact-mobile visual check for spacing against Slick comms and the moved countdown.
- Two-window Versus flow needs a quick smoke test to confirm create/join, ready countdown, Mission Select lock-in, deploy, spectate, and result still behave after moving the lobby controls.
- Death-screen pulsar/repulsor visibility needs a two-window live check to confirm the promoted marker is visible over the ghost arena and not obscured by controls.
- Pocket mode is intentionally disabled in versus; no mirror / sync support was added for it.
- Versus-mode mirror still does not render either boss.
- Repulsor tuning needs a real two-window feel check for radius, arm time, cooldown, and push force.
- Manual Supabase SQL migration for `mode` / `company_id` columns still pending (`docs/sql/2026-04-28 1403 mode and company_id columns.sql`).
- Rep-flux tuning placeholders remain in `tuning.ts`.

## Next actions
1. Run a two-window Versus smoke test from the main menu embedded controls.
2. On a death/spectate screen, tap the peer arena with REPULSOR ready and confirm the arming ring/blast is visible at the tapped location.
3. Check phone-sized main menu spacing with Versus selected, especially countdown placement.

## Active plan
docs/plans/2026-04-30 1240 Plan - New Boss and Wormhole Pocket.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run dev -- --host 0.0.0.0`
3. Create a Versus match in two browser windows and get one player to death/spectate while the other is alive.
4. Wait for REPULSOR to be ready, tap the live peer arena, and confirm the pulsar/repulsor target ring and blast are visible on the death screen.
5. Confirm the live player still receives the repulsor effect.

## Recent logs
- docs/log/2026-05-01 0208 Death Screen Repulsor Visibility.md - promoted spectator repulsor markers above the death-screen mirror.
- docs/log/2026-05-01 0206 Move Versus Countdown.md - moved the embedded Versus countdown down to the bottom action area.
- docs/log/2026-05-01 0205 Remove Versus Bottom Prompt.md - removed the bottom "ROOM SETUP ABOVE" prompt from Versus mode.
- docs/log/2026-05-01 0204 Main Menu Versus Room Setup.md - moved Versus room creation/joining into the main menu and removed the placeholder no-leaderboard text.
- docs/log/2026-05-01 0156 Wormhole All Mineable Asteroids.md - made every wormhole pocket asteroid mineable.
