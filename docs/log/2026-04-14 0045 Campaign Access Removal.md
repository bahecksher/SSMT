# 2026-04-14 0045 Campaign Access Removal

## TL;DR
- What changed: Removed campaign from the accessible menu flow, normalized saved mode selection to arcade, and forced stale campaign handoffs back to arcade in Menu, Mission Select, and Game startup.
- Why: The user reported that campaign still felt buggy and unfinished and wanted it removed for now.
- What didn't work: The first compile pass caught startup branches that had become provably dead after arcade-only normalization, so those checks were trimmed before rebuilding.
- Next: Decide later whether campaign should return as a finished mode or be fully removed from the underlying codebase.

---

## Full notes

- Removed the campaign toggle row from `MenuScene` and replaced it with arcade-only status copy.
- Starting from the menu now always hands off to `MissionSelect` in arcade mode.
- `SaveSystem` now coerces stale selected mode values back to `ARCADE`, which prevents old local saves from silently restoring campaign.
- `MissionSelectScene` and `GameScene` now normalize their startup run mode to arcade so legacy handoff payloads do not reopen campaign.
- Left deeper campaign save/session code intact for now to avoid mixing access removal with a larger deletion refactor.
- Confirmed the project still builds successfully with `npm.cmd run build`.
