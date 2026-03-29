# 2026-03-29 1812 Dev Server Startup Fix

## TL;DR
- What changed: Updated the `dev` script to use Vite's native config loader so local dev startup no longer hits the Windows `spawn EPERM` config-bundling failure.
- Why: The user couldn't get the game running locally with the standard `npm.cmd run dev` flow.
- What didn't work: Vite's default config loader failed while bundling `vite.config.ts`; the `runner` loader also failed in this environment.
- Next: Use `npm.cmd run dev` normally again and check which port Vite chooses if 5173 is already occupied.

---

## Full notes

Observed failure from prior dev logs:
- `failed to load config from ... vite.config.ts`
- `Error: spawn EPERM`

Tested startup options:
- `vite --configLoader runner` failed with `require is not defined`
- `vite --configLoader native` started cleanly

Applied the smallest fix by changing `package.json`:
- `dev` now runs `vite --configLoader native`

Verification:
- `npm.cmd run dev` reached a live server successfully
- In this session Vite skipped occupied ports 5173-5176 and came up on 5177
