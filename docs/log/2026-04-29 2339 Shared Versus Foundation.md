# 2026-04-29 2339 Shared Versus Foundation

## TL;DR
- What changed: added shared-versus simulation, PartyKit server scaffold, WebSocket client, shared GameScene branch, scripts, and simulation tests.
- Why: versus needs one authority for shared resource HP, gates, lasers, and player outcomes instead of two mirrored local worlds.
- What didn't work: Node's built-in test runner hit a Windows sandbox spawn restriction, so tests now run as a single-process assertion script. `partykit@0.0.111` failed locally on Windows/Node with `ERR_INVALID_URL` inside PartyKit's generated file path handling; updating to `partykit@0.0.115` fixed the startup crash.
- Next: run a two-window PartyKit/Vite playtest and expand the server sim to enemies/NPCs/pickups.

---

## Full notes
- Added `src/game/sharedVersus/` with snapshot/message types and a pure shared-world simulation.
- Added `partykit/shared-versus.ts` and `partykit.json`.
- Added `src/game/systems/SharedVersusClient.ts` using native browser WebSocket URLs for PartyKit rooms.
- Wired `GameScene` shared-versus mode behind `VITE_SHARED_VERSUS=1` or `localStorage.ssmt_shared_versus = "1"`.
- Shared mode currently syncs asteroids, salvage, peer ship pose, gates, server score deltas, and world-targeted lasers.
- Existing mirrored versus remains fallback when shared mode is disabled or the PartyKit connection closes/errors.
- Added `npm.cmd test`, `npm.cmd run build`, and a standalone PartyKit TypeScript check.

Verification:
- `npm.cmd test` passes.
- `npm.cmd run build` passes.
- `npx.cmd tsc --noEmit --target ES2023 --module ESNext --moduleResolution Bundler --skipLibCheck --strict --types partykit/server partykit/shared-versus.ts` passes.
- `npm.cmd run partykit:dev -- --port 1999` starts on `partykit@0.0.115`; `http://127.0.0.1:1999/` returns 404, which is expected for the root route.
