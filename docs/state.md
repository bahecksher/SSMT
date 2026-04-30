# State
_Last updated: 2026-04-30 0049_

## Current focus
Shared versus gameplay parity on the PartyKit shared-world branch.

## What's working
- `npm run dev` starts both PartyKit on port `1999` and Vite on `127.0.0.1`, with shared-versus enabled for local testing.
- PartyKit shared rooms are connecting; two players appear in the same server-owned arena.
- The shared simulation owns asteroids, salvage, gates, score deltas, extraction terminals, world-targeted lasers, and no-damage player-player overlap.
- Shared asteroids/salvage spawn from arena edges, move through the arena, deplete, and respawn from server snapshots.
- Server-owned asteroid contact now kills unshielded active players.
- Server-owned asteroid/laser contact now consumes a shield without letting the next client pose restore it.
- The GameScene shared branch now accepts server shield state and shows throttled floating score feedback for shared salvage/mining income.
- Verification passes:
  - `npm.cmd test`
  - `npm.cmd run build`
  - `npx.cmd tsc --noEmit --target ES2023 --module ESNext --moduleResolution Bundler --skipLibCheck --strict --types partykit/server partykit/shared-versus.ts`

## In progress
- Shared versus is being packaged on branch `feature/shared-versus-partykit` for upstream review.
- Shared versus is still a feature-flagged implementation path, not a fully polished replacement for mirrored versus.
- Manual two-window feel testing is needed after the contact/feedback fix.

## Known issues
- Shared simulation does not yet server-own enemies, NPCs, boss behavior, bombs, shield pickups, bonus pickups, or laser pickups.
- Shared extraction/spectate/rematch flow is wired through existing screens but still needs live two-window verification.
- PartyKit deployment target/host is not configured for production yet.
- Existing known issues remain:
  - Tutorial surfaces still need live feel-check.
  - Corporation board still needs compact-phone visual check.
  - TutorialArenaScene BACK still sits top-right, not aligned to shared top-left pattern.
  - Versus mirror framerate fix still needs fresh phone verification.
  - Manual Supabase SQL migration for `mode` / `company_id` columns still pending (`docs/sql/2026-04-28 1403 mode and company_id columns.sql`).
  - Soft respawn keeps rep-flux income accumulators across lives.
  - Rep-flux tuning placeholders remain in `tuning.ts`.

## Next actions
1. Restart `npm run dev` and run a two-window shared-versus test focused on asteroid death, shield consumption, salvage/mining score feedback, and extraction.
2. Add server-owned shared pickups next, starting with shield pickups because the server now owns shield consumption.
3. Add enemies/NPCs only after the basic shared resource and terminal loop feels stable.

## Active plan
docs/plans/2026-04-30 0019 Plan revision - Shared Versus Resource Loop.md

## How to verify
1. `npm.cmd test`
2. `npm.cmd run build`
3. `npx.cmd tsc --noEmit --target ES2023 --module ESNext --moduleResolution Bundler --skipLibCheck --strict --types partykit/server partykit/shared-versus.ts`
4. Manual shared-versus playtest with PartyKit and Vite running together via `npm run dev`.

## Recent logs
- docs/log/2026-04-30 0049 Shared Versus Branch Push.md - packaged current shared-versus work for a new upstream branch.
- docs/log/2026-04-30 0031 Shared Versus Contacts.md - added server-owned asteroid contact, shield consumption authority, and shared score feedback.
- docs/log/2026-04-30 0023 Combined Dev Launcher.md - made `npm run dev` launch both PartyKit and Vite with shared-versus enabled.
