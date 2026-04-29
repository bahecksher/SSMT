# 2026-04-29 1117 Versus Rematch Build Verify and Docs Sync

## TL;DR
- What changed: Re-ran the production build on the current rematch-enabled tree, rewrote `docs/state.md` to reflect the real shipped status, and added a plan revision so the active plan no longer incorrectly says rematch is out of scope.
- Why: Claude's handoff left the code ahead of the docs. `state.md` still described a MENU-only result flow even though the working tree already had an in-place rematch implementation.
- What didn't work: A true two-window multiplayer playtest still can't be completed from this harness. Only build verification was possible here.
- Next: Human-run two-window verify of result flow + rematch, then the pending Supabase migration.

---

## Full notes

### Build verify

Ran:

```bash
npm.cmd run build
```

Result: success. TypeScript passed and Vite produced a production build in `dist/` with no errors.

### Docs sync

`docs/state.md` now matches the current tree:

- versus terminal events and side-by-side result flow are marked shipped
- in-result rematch is listed as working behavior
- verification steps now include rematch states, not just the original Phase 4 result screen
- in-progress / known-issue sections now clearly call out that live multiplayer testing is still owed

### Plan sync

The active Phase 4 plan revision explicitly deferred rematch, but the current code has it. Rather than leaving `state.md` pointed at a stale plan, this session added:

`docs/plans/2026-04-29 1117 Plan revision - Mirrored Versus Multiplayer Rematch.md`

That keeps the append-only plan trail intact and records why rematch moved into scope.
