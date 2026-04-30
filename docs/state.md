# State
_Last updated: 2026-04-30 1818_

## Current focus
Part 1/2 boss-throughline tuning on the active plan: phase-10 boss movement and gunship laser coverage should make shield-ram attacks readable while keeping the bosses threatening.

## What's working
- Phase 10 still picks 50/50 between the Regent gunship and the Slag Hauler.
- The Regent gunship uses the same center-crossing pass model as the Slag Hauler instead of hugging arena edges.
- Gunship hardpoints now have mirrored ports and alternate warning/fire cycles between the two sides of the ship.
- Shield rams can hit either mirrored gun port for a live hardpoint.
- Both current bosses move a little faster than the previous tuning pass:
  - gunship travels at `GUNSHIP_BOSS_BODY_SPEED = 84`
  - Slag Hauler travels at `SLAG_HAULER_BODY_SPEED = 66`
- Boss hardpoints still do not refund direct shields; boss fights still use occasional off-screen shield drift-ins.
- Wormhole pocket work remains intact: rare scheduled natural spawns, yellow loot storm, collapsing red danger boundary, dedicated music, and gate-travel SFX on return.
- `npm.cmd run build` passes.
- Dev server was already running at `http://localhost:5173/`; Vite should pick up the latest changes.

## In progress
- No code left half-done. Gunship alternating-side lasers and boss speed tuning are build-verified but need a phase-10 feel check.

## Known issues
- Gunship center-crossing speed, diagonal beam readability, and alternating-side fire pattern need live shield-ram testing.
- Slag Hauler travel speed is first-pass and may need another pass once vent pressure is judged at the faster pace.
- Pocket mode is intentionally disabled in versus; no mirror / sync support was added for it.
- Natural wormhole run chance is first-pass at 45%.
- Pocket asteroid speed/density, loot cadence, boundary end radius, boundary burn time, and red-zone opacity are first-pass values.
- Exiting a pocket can jump directly to phase 10, which may need a comm/audio beat later so the boss arrival is not abrupt.
- Hauler reuses gunship dialogue keys (`bossEnter` / `bossCoreExposed` / `bossDestroyed`).
- Versus-mode mirror still does not render either boss.
- Repulsor tuning needs a real two-window feel check for radius, arm time, cooldown, and push force.
- Corporation leaderboard globe/ring/company-score animation needs a live visual check on compact and desktop menu layouts.
- Multiplayer spectate music needs a two-window audio check for death, extract, and both-terminal result transitions.
- Bottom-gutter spectate controls need a compact-mobile visual check.
- Live ghost ship placement/readability still needs a two-window feel check.
- Peer-environment mirror is intentionally simplified ghost geometry, not a literal second copy of the opponent's full render path.
- TutorialArenaScene BACK still sits top-right, not aligned to the shared top-left corner pattern.
- Manual Supabase SQL migration for `mode` / `company_id` columns still pending (`docs/sql/2026-04-28 1403 mode and company_id columns.sql`).
- Soft respawn keeps rep-flux income accumulators across lives.
- Rep-flux tuning placeholders remain in `tuning.ts`.

## Next actions
1. Use `Shift+0` to jump to phase 10 repeatedly and verify both boss variants spawn.
2. Watch several gunship laser cycles and confirm beams alternate between both sides clearly.
3. Shield-ram gunship hardpoints from both sides and test the exposed-core breach at `GUNSHIP_BOSS_BODY_SPEED = 84`.
4. Play the Slag Hauler at `SLAG_HAULER_BODY_SPEED = 66` and judge whether vent cadence or body speed should move next.

## Active plan
docs/plans/2026-04-30 1240 Plan - New Boss and Wormhole Pocket.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run dev -- --host 0.0.0.0`
3. Boss pathing:
   - use `Shift+0` to jump to phase 10
   - restart/jump until the Regent gunship appears
   - confirm it crosses through the arena like the Slag Hauler instead of staying on an edge
4. Gunship lasers:
   - observe warning and active laser cycles
   - confirm each hardpoint alternates firing side between cycles
   - shield-ram ports on both sides
5. Boss speed:
   - repeat phase-10 spawns until both bosses appear
   - confirm both traverse the stage slightly faster than the prior tuning pass

## Recent logs
- docs/log/2026-04-30 1818 Gunship Alternating Side Lasers.md - added mirrored gunship ports with alternating-side laser fire and nudged both boss travel speeds up.
- docs/log/2026-04-30 1756 Boss Crossing Path Speed Tuning.md - made the gunship share the hauler's center-crossing pathing and increased both boss travel speeds.
- docs/log/2026-04-30 1750 Wormhole Gate Return SFX.md - made wormhole gate return use the same shared gate-travel SFX as normal extraction.
- docs/log/2026-04-30 1748 Natural Wormhole Rarity.md - changed natural wormholes to a run-level chance with at most one natural spawn per run.
