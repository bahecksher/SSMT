# 2026-03-27 1530 Starfield Page Background

## TL;DR
- What changed: Replaced the page background outside the Phaser canvas with a layered starfield so top and bottom letterboxing no longer appears as black bars.
- Why: `Phaser.Scale.FIT` preserves the portrait play area but leaves extra space on some displays, and that space was breaking the illusion of an endless field.
- What didn't work: Expanding only the in-canvas starfield was not enough because the visible bars were outside the rendered game scene.
- Next: Playtest on taller and wider displays to make sure the background blend feels seamless.

---

## Full notes

Updated `index.html` body styling to render a dark green-black gradient with layered star dots behind the canvas. This keeps the existing gameplay framing intact while making the surrounding space read as part of the same field.
