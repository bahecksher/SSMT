# 2026-04-30 0023 Combined Dev Launcher

## TL;DR
- What changed: `npm run dev` now starts both PartyKit and Vite for shared-versus local testing.
- Why: the normal local workflow should bring up the game and shared-match server together.
- What didn't work: direct `.cmd` spawning from Node hit Windows `spawn EINVAL`; the launcher now uses shell spawning on Windows.
- Next: use `npm run dev` for the next two-window shared-versus playtest.

---

## Full notes
- Added `scripts/dev.mjs`.
- Changed `package.json`:
  - `dev` now runs the combined launcher.
  - `dev:vite` keeps the old Vite-only command available.
- The launcher starts:
  - `npm run partykit:dev -- --port 1999`
  - `npm run dev:vite -- --host 127.0.0.1 --clearScreen false`
- The Vite process gets:
  - `VITE_SHARED_VERSUS=1`
  - `VITE_SHARED_VERSUS_HOST=localhost:1999`
- Verification:
  - `npm.cmd test` passes.
  - `npm.cmd run build` passes.
  - PartyKit server type-check passes.
  - `npm.cmd run dev` smoke test stayed running until command timeout, which indicates both long-lived dev processes launched.
