# 2026-04-27 2045 Affiliation Pick Moved to MissionSelect

## TL;DR
- What changed: corp affiliation selection moved off the main menu and onto the MissionSelect rep panel. Menu's affiliation block stays but is now a read-only display (still shows current corp name + color + bonus, but tap does nothing). Rep panel rows on MissionSelect are now interactive — tap a corp w/ rep ≥ 1 to affiliate, tap the currently-active corp to drop to free agent. Locked corps (rep 0) show an `EARN REP` hint instead of being tappable.
- Why: user explicitly asked to swap the company-select option to the mission-select screen. Affiliation feels more naturally placed next to the rep bars + bonus display where the player is already evaluating which corp to back.
- What didn't work: nothing — single pass, build green first try.
- Next: browser playtest the new tap flow. Plan complete (all 6 phases + this swap).

---

## Full notes

### Files changed
- `src/game/scenes/MenuScene.ts`:
  - Dropped `saveSelectedCompanyAffiliation` import (no longer called from this scene).
  - `affiliationButton` click handler replaced with no-op comment. Hit zone disabled via `this.affiliationButton.hit.disableInteractive()` immediately after creation. The visual button stays — `updateAffiliationSelectorUi()` still updates label / color when called (e.g. on font load) so the menu reflects the player's current corp at a glance.
  - Edit hint copy updated: `TAP CALLSIGN TO EDIT // PICK CORP ON DEPLOY` (compact: `TAP CALLSIGN // PICK CORP ON DEPLOY`).
- `src/game/scenes/MissionSelectScene.ts`:
  - Added `saveSelectedCompanyAffiliation` import alongside the existing companyData imports.
  - Added `CompanyId` import for the new toggle method type.
  - `drawRepPanel` sub-header copy changed to `TAP CORP TO AFFILIATE // TAP ACTIVE TO GO FREE AGENT` (compact: `TAP CORP // TAP ACTIVE TO GO FREE`).
  - Per-row: when `rep <= 0` and not selected, render an `EARN REP` hint on the right side (in the spot where ACTIVE shows for affiliated corps).
  - Per-row: if `rep > 0` OR row is currently selected, attach a hit zone covering the full row (depth 13, above all row contents). Pointer-down stops propagation, calls new `toggleAffiliation(companyId, isSelected)`.
  - New `toggleAffiliation(companyId, currentlySelected)`: calls `saveSelectedCompanyAffiliation(currentlySelected ? null : companyId)`, plays UI select sfx, redraws the rep panel.

### Design decisions
- **Menu affiliation kept as a read-only display** rather than removed entirely. Rationale: player still wants to glance at the menu and see which corp they're working with + the active bonus. Removing the block would have left a visual gap and required a layout reflow. The disabled hit zone removes the misleading hand cursor.
- **Tap-active-to-deselect** instead of a separate FREE AGENT button. Cleaner — no extra row, no separate button, and the interaction model is already standard for pill toggles. The sub-header copy makes the gesture discoverable.
- **`EARN REP` hint on locked corps** replaces the silent no-action state. Without it, players might tap a 0-rep row and wonder why nothing happened.
- **Hit zones at depth 13** to sit above the row's bg (10), text (11), and any decorative overlays. Each row's hit zone is destroyed alongside the rest of `repPanelUi` on the next redraw.
- **No menu-side update needed**: when player returns from MissionSelect to menu (after extract), MenuScene's `updateAffiliationSelectorUi()` runs in `create()` and reflects the corp picked on MissionSelect. No cross-scene event wiring needed.

### Verification
- `npm.cmd run build` → clean (TypeScript + Vite, 766ms). No warnings, no unused imports.

### Notes for next session
- Visual polish: the row hit zones don't currently animate/highlight on hover. If desired, a subtle alpha pulse on the row bg when `pointerover` would make affordance clearer. Skipped for now — keep the change minimal.
- The MenuScene affiliation button's `useHandCursor: true` prop is set when `createMenuButton` runs and persists in the input config, but `disableInteractive` removes the hover state entirely — no cursor change. Consistent.
- If we later want to expose a "FREE AGENT" toggle without requiring an active corp, add a fifth row labeled `FREE AGENT` (or a small button under the panel). Current design only lets you reach free-agent state by tapping the active corp — fine if always at least one corp has rep > 0.
