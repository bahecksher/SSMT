# 2026-03-28 0055 Consumable Lifetimes and Comm Duration

## TL;DR
- What changed: All consumable pickups (bonus, bomb, shield) now have 30-second lifetimes with a 5-second blink warning before expiry. Comm messages (Slick and Regent) display 1 second longer. Vite build config updated with Phaser chunk splitting.
- Why: Consumables were expiring too quickly for players to collect, and comm messages weren't on screen long enough to read.
- What didn't work: Nothing — straightforward changes.
- Next: Playtest the new lifetimes and comm durations.

---

## Full notes

### Consumable lifetimes
- `BONUS_PICKUP_LIFETIME`: 9000 → 30000ms
- `BOMB_PICKUP_LIFETIME`: 12000 → 30000ms
- `ShieldPickup`: Added `private life = 30000` (was infinite)
- All three pickup types now blink during last 5 seconds: slow blink (0.06 rate) from 5s→2.5s, fast blink (0.12 rate) from 2.5s→0s
- Blink pattern: `Math.sin(life * blinkRate) > 0 ? normalAlpha : 0.15`

### Comm duration
- `SlickComm.autoHideMs`: 4200 → 5200ms
- `RegentComm.autoHideMs`: 4600 → 5600ms

### Build config
- Added Phaser chunk splitting to vite.config.ts to resolve large chunk warning
- `chunkSizeWarningLimit: 1300` and manual chunk for `node_modules/phaser`
