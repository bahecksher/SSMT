# 2026-04-30 0031 Shared Versus Contacts

## TL;DR
- What changed: Added server-owned shared asteroid contact rules, server-authoritative shield consumption, local shield sync, throttled shared score feedback, and tests for asteroid death/shield behavior.
- Why: Manual testing showed PartyKit transport was working, but the shared world still felt non-interactive because server-owned resources were not yet driving player contact consequences or visible reward feedback.
- What didn't work: Existing extraction tests assumed players could sit idle in the arena for 31 seconds; after asteroid contact became real, those tests could die before reaching the gate. The tests now add players when extraction is being tested.
- Next: Run a two-window manual test, then add server-owned shared pickups, starting with shields.

---

## Full notes

PartyKit itself is working. The current issue is gameplay parity inside the shared branch.

Implemented the next missing interaction layer in `SharedWorldSimulation`:
- active player plus shared asteroid overlap now produces a server terminal death for unshielded players
- shielded players survive one asteroid or lethal laser contact
- shield contact depletes the shield on the server and marks that player so the next client pose cannot immediately restore the shield
- player-player overlap is still harmless

Updated the GameScene shared branch:
- local player shield state now follows the server snapshot when the server consumes a shield
- shared score deltas now produce throttled floating `+score` feedback near the player

Expanded `test/sharedVersusSimulation.test.ts`:
- unshielded player dies from shared asteroid contact
- shielded player survives asteroid contact, loses shield, and the asteroid is depleted
- extraction tests no longer leave active players drifting through hazards before the gate assertion

Verification run:
- `npm.cmd test`
- `npm.cmd run build`
- `npx.cmd tsc --noEmit --target ES2023 --module ESNext --moduleResolution Bundler --skipLibCheck --strict --types partykit/server partykit/shared-versus.ts`
