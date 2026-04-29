# 2026-04-29 1249 Versus Phase 5 Automated Pass and Mirror Tuning

## TL;DR
- What changed: Tuned the full-arena mirror presentation for better normal-play readability, added a result-screen heartbeat fallback so abrupt peer drops surface as `<CALLSIGN> LEFT`, and completed an automated two-client versus pass covering mirror play, death/death, death/alive, extract/alive with the 15s timeout, and 3 same-session rematches.
- Why: The Phase 5 handoff still owed a real versus validation pass, and the initial mirror screenshots showed the dark backdrop was costing more readability than the peer ghost was providing.
- What didn't work: Supabase presence stayed stale after a hard browser-context drop, so presence alone never flipped `peerLeft`. I patched that with a lightweight result heartbeat timeout. Also, the first extract/alive run let the surviving peer die early, so I had to hold that peer in a safe no-threat state to verify the true 15s timeout branch.
- Next: Optional human two-window desktop feel pass if we want subjective confirmation beyond the automated run. Otherwise move back to the secondary arcade/campaign company-buff verification.

---

## Full notes

Primary code changes this session:

- `src/main.ts`
  - Exposed `window.__BITP_GAME__` so the local headless-browser harness could inspect active scenes and drive the requested versus scenarios without adding gameplay-facing UI.

- `src/game/scenes/GameScene.ts`
  - Reduced the mirror backdrop alpha and raised the peer ship/enemy/label visibility so the mirror reads faster in live play without blanketing the local arena in extra dimming.
  - Added a result-screen heartbeat/watchdog:
    - peers broadcast `MATCH_RESULT_PULSE` once per second while sitting on a versus result screen
    - any peer packet updates `lastPeerSeenAt`
    - if the result screen goes stale for ~3.5s, the survivor now marks `peerLeft = true` and the primary button changes to `<CALLSIGN> LEFT`

- `src/game/systems/NetSystem.ts`
  - Added the new `MATCH_RESULT_PULSE` event constant.

Verification work:

- Re-ran `npm.cmd run build` after each code change. Final build is green.
- Launched a local two-client headless Chrome harness against the Vite dev server and saved artifacts under `.tmp/`.
- Wrote `.tmp/versus-pass-report.json` plus screenshots for the key scenarios:
  - `versus-normal-play-a.png` / `b.png`
  - `versus-death-vs-death-a.png` / `b.png`
  - `versus-death-vs-alive-a-dead.png`
  - `versus-extract-vs-alive-waiting-a.png`
  - `versus-extract-vs-alive-timeout-a.png`
  - `versus-peer-left-a.png`

Automated pass outcomes:

- Normal mirror readability:
  - verified after the mirror alpha tune
  - peer ship/enemy/readout are more legible while the full-arena tint is less intrusive

- Death vs death:
  - both peers reached side-by-side results correctly
  - local/peer columns and winner banner matched the score ordering

- Death vs alive:
  - dead peer immediately saw `STILL ALIVE` in the opponent column
  - surviving peer stayed in gameplay, then resolved correctly once later killed

- Extract vs alive with 15s timeout:
  - verified the waiting panel
  - verified the full timeout path to `WIN` with the peer still marked `STILL ALIVE`
  - then forced the survivor to die so the session could continue into the next rematch

- 3 consecutive rematches on the same session:
  - confirmed over three straight rematches
  - each new `GameScene` reused the original `NetSession` object (`sameSessionRef: true` on both sides)

- Peer disconnect showing `<CALLSIGN> LEFT`:
  - reproduced the old failure where presence stayed stale forever after a hard drop
  - confirmed the new heartbeat fallback flips the result button to `BEE-222 LEFT`

Residual notes:

- The automated pass is strong coverage for Phase 5 logic and UI state, but it is still not a human “feel” pass. If we want to judge whether the mirror is emotionally/visually perfect rather than merely readable/correct, a short manual browser pass is still the next step.
- Arcade/campaign company buffs were intentionally left as secondary follow-up and remain unplayed this session.
