# 2026-03-29 0102 Economy Copy Simplification

## TL;DR
- What changed: rewrote the wallet and Slick text on MissionSelect and the extraction results screen in plainer language.
- Why: labels like `ARM`, `BANK`, and the older wallet/cut wording were too cryptic and took extra effort to parse.
- What didn't work: nothing blocked this pass.
- Next: validate the new copy on a short phone viewport to make sure the clearer wording still fits comfortably.

---

## Full notes

- In `MissionSelectScene`, changed the top economy line to `WALLET / BUYING / AFTER`.
- Reworded the deal line to `YOU KEEP / SLICK TAKES / NEXT DEAL AT ... BANKED`.
- In `GameScene`, changed extraction results to:
  - `YOU KEPT`
  - `WALLET NOW`
  - `SLICK TOOK`
  - `YOU KEEP ... NOW`
  - `NEXT BETTER SPLIT AT ... BANKED`
- `state.md` was rewritten and this session log was added per project process.
