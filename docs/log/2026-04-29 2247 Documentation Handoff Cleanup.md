# 2026-04-29 2247 Documentation Handoff Cleanup

## TL;DR
- What changed: clarified `AGENTS.md` startup rules so agents skim/search `docs/decisions.md` instead of loading the whole growing file by default.
- Why: keep logs and decisions useful as project history without wasting context every session.
- What didn't work: no runtime changes were needed.
- Next: continue using `docs/state.md` as the short current snapshot and keep old logs as linked archive material.

---

## Full notes

- Updated `AGENTS.md` to:
  - read `docs/state.md` first
  - skim/search `docs/decisions.md` only for relevant decisions
  - keep opening logs only when `state.md` links to them
  - replace non-ASCII doc-tree and dash characters with ASCII-safe equivalents
- Added a matching usage note at the top of `docs/decisions.md`.
- Updated `docs/state.md` with this documentation-only cleanup and linked this log.
