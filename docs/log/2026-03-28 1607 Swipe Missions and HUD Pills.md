# 2026-03-28 1607 Swipe Missions and HUD Pills

## TL;DR
- What changed: Replaced hold-to-discard with swipe mechanics on mission select; restyled in-game mission HUD as evenly spaced pill buttons; added horizontal wipe-in animation for Slick/Regent comms on death/extraction
- Why: Hold-to-discard was clunky; missions were hard to read in-game; comms needed more visual impact on results screen
- What didn't work: N/A — clean implementation
- Next: Playtest swipe on mobile, tune thresholds, verify pill readability

---

## Full notes

### Mission Select — Swipe Mechanics
- Removed hold-to-discard entirely (no more DISCARD_HOLD_MS timer or fill overlay)
- Cards are now in Phaser containers that physically move with drag
- Swipe right (>40px threshold): card snaps right (25% of card width offset), shows green border + checkmark + "ACCEPTED" label = mission accepted
- Swipe left (>40px): card snaps left (25% offset), shows red border + X + "SWIPE ◀ AGAIN" warning = pending discard state
- Second swipe left from pending_discard: card animates off-screen left (200ms), new mission slides in from right (250ms)
- Swipe right from pending_discard: returns to neutral
- Swipe left from accepted: returns to neutral
- Swipe right from accepted: returns to neutral (toggle off)
- Cards show directional hints ("◀ DISCARD" / "ACCEPT ▶") only in neutral state
- Instruction text updated to "SWIPE ▶ ACCEPT // SWIPE ◀ DISCARD"
- Discard counter and deploy button unchanged

### In-Game Mission HUD — Pill Buttons
- Replaced stacked 10px text at bottom-left with evenly spaced pill-shaped indicators
- Pills are centered horizontally across the bottom of the screen (54px above bottom edge)
- Each pill: rounded rect (32px tall), dark background with HUD-colored border, mission label (11px, truncated to 14 chars), progress counter or "✓ DONE"
- Subtle progress bar fill inside each pill (HUD color at 8% alpha)
- Completed pills: green border and text, higher alpha
- Pills auto-size to fit screen width with 8px gaps and 12px margins

### Comm Wipe-In Animation
- SlickComm: when pinned (death/extraction results), slides in from off-screen left with Back.Out ease (280ms)
- RegentComm: when pinned, slides in from off-screen right with Back.Out ease (280ms)
- Normal in-gameplay comms retain the original slide-down-from-top animation
- `wipeIn` flag set by `setPinnedLayout()` and `resetLayout()`, cleared on `hide()`
