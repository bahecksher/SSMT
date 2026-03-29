# 2026-03-29 0105 Fixed Split and Expensive Favors

## TL;DR
- What changed: simplified MissionSelect to a single wallet line, removed Slick cut scaling, fixed the split at 60% player / 40% Slick, and raised favor prices into the several-exfils range.
- Why: the economy copy was still too busy, the scaling deal was unnecessary complexity, and favors needed to feel expensive enough to matter.
- What didn't work: the first multi-file patch missed the exact current MissionSelect context, so the scene updates were reapplied in smaller chunks.
- Next: play a few extract-buy cycles to see if the new 60/40 split and high favor prices feel appropriately punishing without stalling progression completely.

---

## Full notes

- Simplified `companyData.ts` payout helpers to a fixed 60/40 split and removed the deal-tier progression logic.
- Removed `careerBankedCredits` from the active save shape and payout flow. Older saved data is simply ignored if it still contains that field.
- Simplified MissionSelect so the favor section header is just `WALLET: ...` above the grid.
- Raised favor costs to premium levels:
  - DEEPCORE / RECLAIM: `8000 / 18000 / 32000`
  - IRONVEIL: `9000 / 20000 / 36000`
  - FREEPORT: `7500 / 16500 / 29000`
- Simplified extraction results to show wallet gain, wallet total, and the fixed 60/40 split without any future-deal copy.
- Verified the change set with `npm.cmd run build`.
