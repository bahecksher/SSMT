# 2026-04-29 1140 Mode Selector Cycle Affordance

## TL;DR
- What changed: Added chevrons around the selected mode label and a faint `TAP TO CYCLE MODES` hint under the main menu mode selector.
- Why: User feedback said the existing versus/campaign/arcade control looked too much like a static label and did not clearly suggest there were other modes available.
- What didn't work: No plan revision for this one. This is a small user-requested UI affordance tweak outside the current versus polish plan, so I kept it targeted and logged the divergence here instead of creating a new plan branch.
- Next: Human pass on desktop and narrow/mobile layouts to confirm the wider selector and hint still feel balanced next to the leaderboard block.

---

## Full notes

### UI tweak

`src/game/scenes/MenuScene.ts`

- widened the mode selector slightly to make room for the stronger label treatment
- changed the active mode label from plain `ARCADE` / `CAMPAIGN` / `VERSUS` to `< ARCADE >`-style framing
- inserted a small `TAP TO CYCLE MODES` hint directly under the selector

The interaction is unchanged: still one tap to advance through the mode cycle in the same order.

### Build verify

Ran:

```bash
npm.cmd run build
```

Result: success. TypeScript passed and Vite produced a production build without errors.
