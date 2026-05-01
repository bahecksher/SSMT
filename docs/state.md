# State
_Last updated: 2026-05-01 0156_

## Current focus
Wormhole pocket phone readability and survivability: make the player ship and safe boundary readable against the yellow/gold pocket visuals.

## What's working
- Main game difficulty still scales with arena area through `getArenaDensityScale()`.
- Wormhole pockets now layer a screen-size profile on top of that scaling:
  - full-size layouts keep the original pocket pressure.
  - narrow or short layouts use lower asteroid cap, slower spawn pressure, slower asteroid speed, and cap pocket asteroid size at `3.2`.
  - layouts that are both narrow and short get a stronger relief profile and cap pocket asteroid size at `2.2`.
- Pocket player color is now electric cyan instead of white/yellow.
- Player ship rendering now draws a subtle dark backing stroke under the triangle so it stays legible over bright objects and backgrounds.
- Pocket asteroids now use the same grey/inert-grey colors as the main arena.
- Wormhole boundary now has a more opaque outside danger veil.
- Boundary veil mask direction was corrected after the first pass rendered the visual emphasis inverted.
- Boundary ticks and secondary rings now sit outside the safe circle, keeping the playable interior cleaner.
- Pocket enemy/beam suspension, loot cadence, boundary collapse, dedicated music, and gate return behavior remain unchanged.
- Phase 10 boss work remains intact.
- Gunship laser hardpoints now expose only one visible/collidable weak point per laser instead of mirrored front/back ports.
- Gunship laser beams now extend to and slightly past the full game canvas edge instead of stopping at the arena border.
- Player token now renders above boss bodies and gameplay hazards so it does not disappear while flying around bosses.
- Asteroids now render above boss bodies, while still below the player token.
- Both boss exposed cores now draw a pulsing reticle around the breach target.
- Both boss exposed cores now include a small rotating device inside the core as the shield-ram target.
- Exposed boss cores now destroy immediately on shielded device/core contact instead of requiring an exit-after-entry breach.
- Boss death now sprays `BOSS_DEFEAT_BONUS_PICKUP_COUNT = 12` smaller bonus pickups totaling `BOSS_DEFEAT_BONUS_POINTS = 2500`.
- Boss reward pickups now drift slowly (`18-55` radial speed plus light inherited push) so they are collectible after the burst.
- Boss death now starts a post-boss enemy surge: 4 enemies immediately, then one every `1800ms` up to 10 active enemies.
- Hidden debug shortcut `Shift+I` toggles invulnerability and blocks score recording while enabled.
- Shields still collide, break, and perform shield-ram actions while debug invulnerability is enabled.
- The top-center boss status text (`GUNSHIP // FIRING ...`) has been removed from the arena HUD.
- Wormhole pocket now suppresses normal salvage respawns and spawns only rare salvage.
- Entering a wormhole pocket now seeds one rare salvage immediately.
- Wormhole pocket asteroids are now always mineable (`WORMHOLE_POCKET_MINEABLE_CHANCE = 1.0`).
- `npm.cmd run build` passes.

## In progress
- No code left half-done. Compact wormhole tuning, player readability, and boundary readability are build-verified but need phone feel testing.

## Known issues
- Phone wormhole pocket values are first-pass; live testing may need another adjustment to speed, cap, or spawn rate.
- Pocket readability needs a real phone check after the cyan player / grey asteroids / backing stroke / corrected boundary veil changes.
- Gunship center-crossing speed, off-screen laser extension, diagonal beam readability, player/asteroid-over-boss layering, immediate exposed-core kill, slower boss reward burst, post-boss enemy extraction pressure, exposed-core device readability, and single-port hardpoint flow need live shield-ram testing.
- Debug invulnerability needs a quick check that shields still break against asteroids, enemies, boss hardpoints, boss cores, and pocket boundary damage.
- Boss status text removal needs a phase-10 visual check to confirm no stale label remains.
- Wormhole rare-only salvage needs a pocket check to confirm no normal green/yellow salvage appears.
- Wormhole all-mineable asteroids need a pocket check for readability and mining reward feel.
- Slag Hauler travel speed is first-pass and may need another pass once vent pressure is judged at the faster pace.
- Pocket mode is intentionally disabled in versus; no mirror / sync support was added for it.
- Natural wormhole run chance is first-pass at 45%.
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
1. Test wormhole pocket on a phone-sized viewport and confirm grey asteroids are readable against the gold pocket background.
2. Confirm the corrected collapsing circle leaves the inside clear and makes the outside more opaque.
3. Judge survival time in the first 5-10 seconds of phone pocket play.
4. Use `Shift+0` to test boss core kills and confirm the post-boss enemy surge makes extraction urgent.
5. Use `Shift+I` during testing to toggle invulnerability when checking boss/pocket readability.
6. Confirm phase-10 boss fights rely on visuals/comms only and no longer show the top-center boss status text.
7. Enter wormhole space and confirm all salvage is rare salvage.
8. Confirm every wormhole asteroid has the mineable ring/behavior.

## Active plan
docs/plans/2026-04-30 1240 Plan - New Boss and Wormhole Pocket.md

## How to verify
1. `npm.cmd run build`
2. `npm.cmd run dev -- --host 0.0.0.0`
3. Wormhole compact tuning:
   - test in a phone-sized viewport.
   - debug-spawn a wormhole or enter naturally after phase 5.
   - confirm the player ship and grey asteroids stay readable over the yellow/gold pocket visuals.
   - confirm the boundary outside the circle is visibly more opaque than the safe interior.
   - confirm the first seconds of pocket play are survivable and rocks no longer feel instantly unavoidable.
   - repeat on a larger viewport and confirm the pocket still feels like a dense loot storm.
4. Gunship:
   - use `Shift+0` to jump to phase 10.
   - restart/jump until the Regent gunship appears.
   - confirm lasers extend visually past the arena border to the screen edge.
   - confirm each live laser has only one visible/collidable weak point.
   - shield-ram hardpoints and confirm the player is not forced into a second mirrored port immediately behind the first.
   - destroy all hardpoints/segments and confirm the exposed core reticle/device clearly marks the breach target.
   - shield-ram the exposed device/core and confirm the boss dies immediately.
   - confirm 12 smaller reward pickups spray from the boss, totaling `+2500`, and remain collectable.
   - confirm red enemies spawn immediately after boss death and continue reinforcing until extraction.
   - fly over/around both boss bodies and confirm the player token and asteroids remain visible above boss bodies.
4. Debug invulnerability:
   - press `Shift+I` in a live run.
   - confirm Slick reports invulnerability on/off.
   - confirm the player survives hazards while on.
   - confirm shields still break/destroy hazards and boss targets while invulnerability is on.
   - confirm normal damage resumes when off.
5. Wormhole salvage:
   - enter a wormhole pocket.
   - confirm one rare salvage appears immediately.
   - confirm timed salvage spawns are rare-only and no normal salvage respawns.
   - confirm all asteroids are mineable.

## Recent logs
- docs/log/2026-05-01 0156 Wormhole All Mineable Asteroids.md - made every wormhole pocket asteroid mineable.
- docs/log/2026-05-01 0148 Wormhole Rare Salvage Only.md - suppressed normal salvage respawns in pocket mode and seeded rare salvage on entry.
- docs/log/2026-05-01 0145 Debug Shields and Boss Status Cleanup.md - kept shield behavior active under debug invulnerability and removed the boss status HUD label.
- docs/log/2026-05-01 0134 Debug Invulnerability Shortcut.md - added `Shift+I` and `window.bitpToggleInvulnerable()` to toggle invulnerability for testing.
- docs/log/2026-05-01 0132 Post Boss Enemy Surge.md - added a red enemy wave after boss death to pressure immediate extraction.
- docs/log/2026-05-01 0131 Boss Bonus Slow Drift.md - slowed boss reward pickup ejection so the loot burst remains collectible.
- docs/log/2026-05-01 0129 Boss Bonus Burst.md - changed boss reward from one large pickup into 12 smaller pickups totaling 2500.
- docs/log/2026-05-01 0117 Boss Immediate Core Kill Reward.md - made exposed cores die on shielded contact and added a 2500-point boss reward pickup.
- docs/log/2026-05-01 0107 Asteroids Above Bosses.md - raised asteroid graphics above boss bodies while keeping them below the player.
- docs/log/2026-05-01 0102 Boss Core Device Targets.md - added a small rotating device inside each exposed boss core as the shield-ram target.
- docs/log/2026-05-01 0100 Boss Player Layer and Core Reticles.md - raised the player token above bosses and added exposed-core reticles to both boss types.
- docs/log/2026-05-01 0056 Gunship Lasers Offscreen.md - extended gunship laser endpoints to the full game canvas instead of the arena edge.
- docs/log/2026-05-01 0052 Gunship Single Laser Weak Points.md - removed mirrored gunship laser ports so each laser has one weak point.
- docs/log/2026-05-01 0045 Wormhole Grey Asteroids.md - changed pocket asteroid colors back to the main-arena grey pair.
- docs/log/2026-05-01 0022 Wormhole Boundary Mask Fix.md - flipped the boundary fill path after the first readability pass rendered inside/outside inverted.
- docs/log/2026-05-01 0021 Wormhole Boundary Readability.md - made the pocket danger exterior more opaque and moved boundary detail outside the safe circle.
- docs/log/2026-05-01 0016 Wormhole Player Readability.md - changed pocket player color to cyan and added a dark ship backing stroke for better contrast.
- docs/log/2026-05-01 0012 Wormhole Compact Tuning.md - added screen-size-aware wormhole pocket pressure profiles for phone layouts.
- docs/log/2026-04-30 1818 Gunship Alternating Side Lasers.md - added mirrored gunship ports with alternating-side laser fire and nudged both boss travel speeds up.
- docs/log/2026-04-30 1756 Boss Crossing Path Speed Tuning.md - made the gunship share the hauler's center-crossing pathing and increased both boss travel speeds.
