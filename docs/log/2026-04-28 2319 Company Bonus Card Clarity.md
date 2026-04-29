# 2026-04-28 2319 Company Bonus Card Clarity

## TL;DR
- What changed: MissionSelect company rows now surface each corp's current run bonus again, with compact fallback copy on tight layouts and first-unlock preview copy for zero-rep corps.
- Why: the static affiliation buffs were still wired into gameplay, but the UI no longer made it obvious what each company actually gives you.
- What didn't work: nothing blocked this pass; the underlying buff values are still placeholder scaffolding and were not retuned here.
- Next: playtest the rep panel on a phone-sized viewport, then tune the bonus numbers/copy once the visibility pass feels right.

---

## Full notes

- Targeted divergence from the active versus plan: while multiplayer work continues elsewhere, this pass only restored corporation bonus visibility on MissionSelect.
- `src/game/data/companyData.ts`
  - Added reusable long/compact boost labels plus `getCompanyBoostSummary(...)`.
  - Clarified Iron Veil's copy to `BANKED SCORE` so the text matches the actual bank-on-extract multiplier behavior.
  - Zero-rep rows now preview the first unlock instead of showing an unhelpful `+0%`.
- `src/game/scenes/MissionSelectScene.ts`
  - Rep rows show the bonus summary again.
  - Normal layouts get a dedicated `BOOST // ...` subline.
  - Tighter layouts collapse the bonus copy into the right-hand summary so the row still fits.
- Verification: `npm.cmd run build` passed.
