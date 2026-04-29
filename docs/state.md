# State
_Last updated: 2026-04-29 1249_

## Current focus
Phase 5 mirrored versus is now build-green and automated two-client verified for the full-arena mirror, result flow, rematch reuse, and peer-left handling. Next session can either do a human desktop feel pass for subjective readability/juice or move to the secondary arcade/campaign company-buff check.

## What's working
- `src/main.ts`: exposes `window.__BITP_GAME__` so local runtime probes can inspect the active Phaser scene graph during automated verification.
- `src/game/systems/NetSystem.ts`: versus event map now includes `MATCH_RESULT_PULSE` for result-screen heartbeat traffic.
- `src/game/scenes/GameScene.ts`:
  - full-arena mirror backdrop is tuned lighter, while peer ship/enemy/readout alpha is stronger for normal-play readability.
  - automated two-client pass covered normal mirror play, death vs death, death vs alive, extract vs alive with the full 15s timeout branch, and 3 consecutive rematches over the same `NetSession`.
  - result-screen peer disconnect now falls back to a lightweight heartbeat timeout, so the rematch button reliably degrades to `<CALLSIGN> LEFT` even when Supabase presence stays stale after a hard drop.
- `npm.cmd run build`: passes.
- `.tmp/versus-pass-report.json` plus the saved `.tmp/*.png` captures document the latest automated versus pass.

## In progress
- Human two-window feel pass is still optional but not done from this session. The automation verified logic and presentation, not whether the mirror feels ideal to a real player on mouse/keyboard.
- Restored arcade/campaign company-buff behavior is still build-verified only. No manual balance pass yet.
- Manual Supabase SQL migration for `mode` / `company_id` columns is still pending (`docs/sql/2026-04-28 1403 mode and company_id columns.sql`).
- Cold-refresh phone playtest of the startup trim is still pending.

## Known issues
- Result-screen peer-left handling no longer depends solely on Supabase presence, but the new heartbeat fallback is only exercised in desktop headless automation so far. Background-tab/mobile throttling is still unverified.
- Mirror enemy ghosts still pair by array index, so mid-snapshot reorder can shimmer for one frame.
- Restored arcade company buffs are not manually verified or balance-tested yet.
- Supabase migration required: `scores` and `losses` still need nullable `mode` and `company_id` columns. Until applied, write calls strip unsupported fields and leaderboard reads fall back to mixed legacy rows.
- Soft respawn keeps rep-flux income accumulators across lives.
- Rep-flux tuning placeholders remain in `tuning.ts`.

## Next actions
1. If desired, do a short human two-window desktop/browser pass to judge mirror feel now that the automated Phase 5 matrix is clean.
2. Separately, manually verify the restored company-buff behavior in `ARCADE` and `CAMPAIGN` and judge whether arcade balance gets too generous.
3. Apply the pending Supabase `mode` / `company_id` migration.

## Active plan
docs/plans/2026-04-29 1132 Plan revision - Mirrored Versus Full Arena Mirror.md

## How to verify
1. `npm.cmd run build`
2. Review `.tmp/versus-pass-report.json` and the saved `.tmp/versus-*.png` captures from the latest automated two-client pass.
3. Optional manual spot-check: `npm.cmd run dev`, open two browser windows, and confirm the mirror/readout/result flow still feels good in real play.

## Recent logs
- docs/log/2026-04-29 1249 Versus Phase 5 Automated Pass and Mirror Tuning.md - tuned mirror readability, added result heartbeat fallback, and completed the automated two-client versus matrix.
- docs/log/2026-04-29 1157 Session Wrap and Phase 5 Handoff.md - closed the previous session with the pending versus playtest and readability pass at the top of the queue.
- docs/log/2026-04-29 1155 Restore Arcade Company Buffs.md - restored static company buffs to arcade for playtesting while keeping versus neutral.
- docs/log/2026-04-29 1138 Versus Uses Saved Callsign.md - switched versus labels/results/rematch states over to the saved menu callsign.
