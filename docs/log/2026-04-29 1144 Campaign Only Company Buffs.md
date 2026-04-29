# 2026-04-29 1144 Campaign Only Company Buffs

## TL;DR
- What changed: Static company affiliation buffs no longer apply in arcade runs. Campaign still gets them. Mission Select now labels the perk line as campaign-only while in arcade.
- Why: User wanted company selection to matter for gameplay boosts only in campaign mode, not arcade.
- What didn't work: This diverges from the current active versus-polish plan, so I kept the change targeted and logged the divergence here rather than creating a plan revision for an unrelated thread.
- Next: Human spot-check that campaign still receives the selected perk and arcade stays neutral.

---

## Full notes

### Gameplay gate

Two guards were added so the mode split is reliable even if an older handoff path tries to pass boosts where it should not:

- `MissionSelectScene.deploy()` now only passes `runBoosts` when `runMode === CAMPAIGN`.
- `GameScene.create()` now only keeps/applies `activeRunBoosts` when `runMode === CAMPAIGN`.

That means arcade and versus both ignore the static company boost package even if a stale handoff object contains it.

### UI copy

`MissionSelectScene.drawRepPanel()` now rewrites the company perk line in arcade mode:

- campaign keeps the normal perk summary
- arcade prepends a campaign-only label so the player is not told the perk is active right now

### Spec update

Added:

`docs/spec/2026-04-29 1144 Spec - Campaign Only Company Buffs.md`

This captures the gameplay-rule change without rewriting older spec files.

### Build verify

Ran:

```bash
npm.cmd run build
```

Result: success. TypeScript passed and Vite produced a production build without errors.
