# 2026-03-29 0209 Land Cursor Merge on Main

## TL;DR
- What changed: fast-forwarded local `main` to include the merged desktop cursor branch
- Why: make the cursor work part of the default branch instead of leaving it only on the integration branch
- What didn't work: the first fast-forward attempt used parallel shell calls, so `main` did not move until the merge was rerun sequentially
- Next: push `origin/main` and desktop-playtest the cursor feel in active scenes

---

## Full notes

- Checked out `main` and fast-forwarded it from `3778920` to merge commit `ef27e70`.
- Re-ran `npm.cmd run build` on `main` after the fast-forward.
- Updated `docs/state.md` to reflect that the cursor merge now lives on local `main`.
