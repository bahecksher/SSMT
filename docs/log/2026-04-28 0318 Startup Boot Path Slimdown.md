# 2026-04-28 0318 Startup Boot Path Slimdown

## TL;DR
- What changed: trimmed the boot-time music preload back down to `menuSynth`, `bassOne`, and `drumsTwo`; restored background warming for the later gameplay stems; added seek alignment so those later stems can join the running gameplay stack on-beat; and removed the long boot/font wait so the menu appears much sooner.
- Why: phone startup still felt too slow, and the current boot path had regressed into loading too much audio before the player could even see the menu.
- What didn't work: I couldn't measure real-device cold-start timings headlessly here, so this pass is build-verified and code-path-reasoned, not playtest-verified.
- Next: hard-refresh on phone, then specifically smoke-test first menu music unlock and the phase 3→4 music swap.

---

## Full notes

### Files changed
- `src/game/scenes/BootScene.ts`
- `src/game/systems/MusicSystem.ts`
- `docs/plans/2026-04-28 0318 Plan revision - Startup Loading Performance.md`
- `docs/state.md`
- `docs/log/2026-04-28 0318 Startup Boot Path Slimdown.md`

### What works
- Boot no longer waits for title-font readiness before showing the menu.
- Forced boot hold is much shorter (`450ms` instead of the previous multi-step wait).
- Boot music preload is back to a lighter set, so startup should spend less time downloading/decoding audio before the menu appears.
- Later gameplay stems still get started automatically once they finish loading, and now use seek alignment instead of blindly starting from zero.
- `npm.cmd run build` passes.

### What is still stubbed
- No real phone cold-refresh timing numbers yet.
- No live audio verification yet for the new seek-alignment path.

### Risks / follow-ups
- If the reference-stem seek alignment is not reliable enough on mobile browsers, the next fallback is more invasive: lazy-load scenes and/or extract a more explicit stem-resync mechanism.
- If startup still feels too slow after this pass, code-parse cost is the next likely bottleneck: Menu, MissionSelect, Game, and Tutorial are still all imported into the initial bundle.
