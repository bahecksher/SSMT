# 2026-03-26 2332 NPC Ships Rename and GitHub Pages

## TL;DR
- What changed: Added NPC competitor ships, renamed game to Slick's Salvage & Mining Operation Training Module, deployed to GitHub Pages
- Why: NPCs make the arena feel alive; rename reflects game identity; GitHub Pages lets others play
- What didn't work: `gh` CLI not installed so GitHub Pages had to be enabled manually in repo settings
- Next: Playtest NPC behavior and tuning, audio/settings (phase 6), verify GitHub Pages deployment

---

## Full notes

### NPC "other player" ships
- New entity: `NPCShip` — amber/yellow triangle ships spawning from off-screen edges
- Appear at phase 2, up to 3 concurrent in later phases (spawn rate 15s base, decreasing per phase)
- Navigate toward nearest non-depleted salvage using steering AI with turn rate limits
- Deplete salvage HP at 1 HP/sec when in salvage radius
- Destroyed by asteroids (circle collision) and enemy ships (circle collision)
- Enemy ships sometimes hunt NPCs instead of the player (when NPC is closer)
- Player can bump NPCs away with impulse force (250px/s within 18px) — no kill
- Hazard-killed NPCs drop a shield pickup at death position (offscreen despawns don't)

### Game rename
- Title: "Slick's Salvage & Mining Operation Training Module"
- Menu screen: 3-line stacked layout ("SLICK'S" / "SALVAGE & MINING" / "OPERATION TRAINING MODULE")
- Browser tab, package name, localStorage save key all updated
- Note: save key changed from `bitpailot_save` to `ssmt_save` — resets existing best scores

### GitHub Pages deployment
- Added `.github/workflows/deploy.yml` — builds with Vite on push to main, deploys to Pages
- Vite base changed from `./` to `/SSMT/` for GitHub Pages path
- Repo initialized and pushed to https://github.com/bahecksher/SSMT
- Game accessible at https://bahecksher.github.io/SSMT/

### Files created
- `src/game/entities/NPCShip.ts`
- `.github/workflows/deploy.yml`

### Files modified
- `src/game/data/tuning.ts` — NPC constants
- `src/game/types.ts` — PhaseConfig NPC fields
- `src/game/data/phaseConfig.ts` — NPC phase scaling
- `src/game/systems/DifficultySystem.ts` — NPC spawning, collisions, enemy targeting, cleanup
- `src/game/scenes/GameScene.ts` — NPC salvage targeting, bump physics, shield drops
- `src/game/scenes/MenuScene.ts` — new title layout
- `src/game/constants.ts` — save key rename
- `index.html` — title rename
- `package.json` / `package-lock.json` — package name
- `vite.config.ts` — base path for GitHub Pages
- `docs/decisions.md` — NPC decision entry
