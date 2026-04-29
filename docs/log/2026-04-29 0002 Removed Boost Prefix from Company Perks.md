# 2026-04-29 0002 Removed Boost Prefix from Company Perks

## TL;DR
- What changed: removed the `BOOST //` prefix from the company perk line on Mission Select.
- Why: keep the corporation perk copy cleaner and more direct on the company panel.
- What didn't work: nothing blocked this pass.
- Next: manual check the company rows on compact/mobile layout to make sure the cleaner copy still reads nicely.

---

## Full notes

- The Mission Select reputation/company panel still renders the same perk summaries for each corporation.
- Only the visible line prefix changed: instead of `BOOST // MINING YIELD +15%`, the row now just shows `MINING YIELD +15%`.
- `npm.cmd run build` passes after the text-only tweak.
