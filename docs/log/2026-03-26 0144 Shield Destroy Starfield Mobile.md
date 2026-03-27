# 2026-03-26 0144 Shield Destroy Starfield Mobile

## TL;DR
- What changed: Shield now destroys/splits asteroid on contact; starfield background added; vite config fixed for LAN mobile access
- Why: User-requested gameplay and QoL improvements
- What didn't work: Nothing — clean implementation
- Next: Playtest on mobile, continue Phase 6

---

## Full notes

### Shield destroys asteroid on contact
- CollisionSystem.checkDrifters now returns the colliding DrifterHazard (or null) instead of boolean
- GameScene passes the hit drifter to DifficultySystem.shieldDestroyDrifter()
- Large asteroids split into two fragments (same logic as asteroid-asteroid splitting); small ones just get destroyed
- Shield is still consumed on the hit

### Starfield background
- 120 random dots drawn at depth -1 behind everything in GameScene.create()
- Varying brightness (0.15–0.6) and size (0.5–1.5px) for natural look
- Static — no parallax or movement (keeps it simple)

### Mobile LAN access fix
- Added `server: { host: true }` to vite.config.ts
- Without this, Vite only bound to localhost; now binds to 0.0.0.0 so LAN devices can connect
- If still blocked, Windows Firewall may need a rule for the Vite port (noted in known issues)
