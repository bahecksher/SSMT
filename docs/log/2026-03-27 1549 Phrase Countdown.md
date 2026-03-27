# 2026-03-27 1549 Phrase Countdown

## TL;DR
- What changed: Replaced the numeric run-start countdown with four short tutorial phrases and resized the center text to fit them cleanly.
- Why: The run intro should teach the loop faster and feel more thematic than a plain `3, 2, 1`.
- What didn't work: Longer phrases would not fit well at the old countdown text size, so the countdown text needed a smaller centered layout.
- Next: Playtest whether the four-beat timing still feels snappy enough on repeat runs.

---

## Full notes

- The countdown now steps through `STAY ALIVE`, `GET PAID`, `GET OUT`, and `GO`.
- The countdown duration now matches the four phrase beats.
- The center countdown text uses a smaller font with centered alignment and wrapping so the phrases stay readable.
- Verified with `npm.cmd run build`.
