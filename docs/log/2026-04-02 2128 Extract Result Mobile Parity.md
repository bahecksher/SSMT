# 2026-04-02 2128 Extract Result Mobile Parity

## TL;DR
- What changed: Made the extraction result overlay follow the destroyed-screen composition more closely on compact screens by switching to an `EXTRACTED` title, using `CREDITS BANKED` for the main summary, tightening the mission stack start, and collapsing the extra economy detail to a single wallet line on phones
- Why: The user reported that the destroyed screen looked good on phones while the extraction screen looked noticeably worse
- What didn't work: No live phone playcheck happened in-session; verification stayed at `npm.cmd run build` plus code inspection
- Next: Check both death and extraction overlays on an actual phone-sized viewport and trim any remaining spacing issues

---

## Full notes

- This session intentionally diverged from the active layered-music plan to address a direct user-requested result-screen polish issue.
- Updated `src/game/scenes/GameScene.ts` so the extraction state now reads much closer to the destroyed state visually, instead of feeling like a separate looser layout.
- On compact result screens, extraction now keeps the wallet gain/total line but drops the secondary Slick split line, which frees vertical room for missions, comms, and buttons.
- The compact mission block for extraction now starts on the same tighter rhythm used by the destroyed screen.
- Verified with `npm.cmd run build`.
