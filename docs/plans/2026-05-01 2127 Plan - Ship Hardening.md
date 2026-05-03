# 2026-05-01 2127 Plan - Ship Hardening

_Status: Active_
_Goal: Ship current build intact. Lock scope, kill regressions, defer polish._

## Scope lock

- [ ] No new features until ship. Live opponent HUD chips deferred post-ship.
- [ ] Re-classify every entry in `state.md` Known Issues as **BLOCKER** or **DEFERRED**.
- [ ] Capture deferred list in a "Post-ship backlog" section of `state.md` so nothing rots.

## Build + env baseline

- [ ] `npm.cmd run build` clean (no warnings escalated to errors).
- [ ] `npm.cmd run dev -- --host 0.0.0.0` boots without console errors.
- [ ] LAN URL reachable from phone.

## Versus smoke matrix (highest risk surface)

Use existing `.tmp/chrome-playtest*` profiles for independent localStorage / callsigns.

### 1v1
- [x] Create + join, ready, countdown, deploy.
- [x] Both extract → result.
- [x] Both die → result.
- [x] One extract / one die → result.
- [x] Spectate after local death works.
- [x] Repulsor flow intact.
- [x] Rematch button works.

### 2p (treated as 1v1 path)
- [x] Same as 1v1 row above. Confirm path classification.

### 3p
- [x] Lobby roster stacked vertically, all three visible. (cosmetic crowding under room code — deferred)
- [x] READY enables only with 3 active pilots.
- [x] Deploy: each pilot sees two color-coded ghost ships in their arena.
- [x] Broadcast laser: 10s regen, fires, hits remote pilots in their color.
- [x] Broadcast enemy: 20s regen, spawns in sender color in target arenas.
- [x] Terminal scoreboard shows live standings with broadcast controls.
- [x] All three reach terminal → `FINAL STANDINGS` ranked table.
- [x] Mid-match disconnect of one pilot → remaining two still resolve; leaver shown DESTROYED with last known score. (color drift on leaver row — known issue, deferred)

### 4p
- [x] Lobby roster stacked, all four visible. (cosmetic crowding under room code — same as 3p, deferred)
- [x] READY enables with 4 active pilots.
- [x] Each pilot sees three ghost ships, distinct colors.
- [ ] Broadcast laser/enemy reach all three remote pilots.
- [ ] Terminal scoreboard correct ranking.
- [ ] Final ranked table on full resolution.
- [ ] Two-pilot mid-match disconnect still resolves remaining two.

### Death attribution coverage
Force each killer type once across runs. Verify label on death card and standings row.

- [x] `ASTEROID`
- [ ] `REGENT ENEMY`
- [ ] `REGENT BEAM`
- [ ] `BOSS BEAM` (solo only — Versus mirror skips bosses)
- [ ] `<PILOT> LASER`
- [ ] `<PILOT> ENEMY`

### Mobile pass
- [ ] Lobby compact layout readable on phone.
- [ ] Touch controls + pause + extract on phone.
- [ ] HUD pills not clipped.

## Solo regression sweep

Versus work touched `GameScene` (mission suppression, company liaison gating). Confirm solo intact.

- [ ] Quick Play loads missions.
- [ ] Mission select swipe + hold-to-discard.
- [ ] Company reputation UI updates after run.
- [ ] Boss encounters spawn in solo (NOT in Versus mirror — known).
- [ ] Pause + resume countdown.
- [ ] Death wipe + extract + comm overlays.
- [ ] Leaderboard submit + display.
- [ ] Callsign edit persists.

## Instrumentation (temporary, strip before tag)

- [ ] Add `console.warn` at each killer-descriptor branch. Confirm correct branch fires per scenario.
- [ ] Add `?debug=1` flag exposing net payload sender/target ids on-screen for ghost-ship verification.
- [ ] Remove all `?debug=1` paths and warns before tagging.

## Supabase migration (BLOCKER)

- [ ] Apply `docs/sql/2026-04-28 1403 mode and company_id columns.sql` to prod DB.
- [ ] Verify columns present via Supabase dashboard.
- [ ] One solo run → row written with correct `mode` + `company_id`.
- [ ] One Versus run → row written with correct `mode`.
- [ ] No 500s in network tab on score submit.

## Deferred (ship with these as Known Issues)

- Multi-pilot rematch button (MENU works).
- Compact in-run opponent HUD chips.
- Pocket mode in Versus (intentionally disabled).
- Versus mirror boss rendering.
- Old `VersusLobbyScene` dead code in scene list.
- Multi-pilot spectate redesign (heavy-dim standings + primary-peer mirror).
- **1v1 sabotage swap:** replace repulsor with broadcast laser + enemy spawn (parity with 3-4p). Requires GameScene + net payload + UI rework. Post-ship.

## Pre-tag checklist

- [ ] `git status` clean (no stray `.tmp` adds, no debug flags).
- [ ] `npm.cmd run build` final pass.
- [ ] Smoke matrix all green or each red item logged in Known Issues.
- [ ] DB migration applied + verified.
- [ ] Tag commit.
- [ ] GitHub Pages deploy.
- [ ] Hit live URL from phone + desktop, run one solo + one Versus.

## Rollback plan

- [ ] Note prior good commit hash before tagging: `git rev-parse HEAD` of last shipped commit.
- [ ] If post-deploy break: revert GitHub Pages branch to prior hash, no DB rollback needed (additive columns).
