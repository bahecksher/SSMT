# 2026-03-26 1412 Dev Environment Verification

## TL;DR
- What changed: Verified Node.js is installed, confirmed project dependencies are already installed, and identified the PowerShell-safe command required to run the Vite dev server for phone testing.
- Why: `npm run dev` was blocked by environment setup rather than missing packages.
- What didn't work: Plain `node`/`npm` were not on `PATH`; `npm` resolved to `npm.ps1`, which is blocked by execution policy; sandboxed Vite startup hit a Windows `spawn EPERM`.
- Next: Start the dev server from PowerShell using the documented `PATH` + `npm.cmd` command, then open the Network URL on a phone on the same Wi-Fi.

---

## Full notes

- Read `AGENTS.md`, `docs/state.md`, `docs/decisions.md`, the active plan, and the current spec before making changes.
- Confirmed `package.json` already declares the needed dependencies: `phaser`, `typescript`, and `vite`.
- Confirmed `node_modules` is present and `npm install` reports everything is up to date.
- Found Node.js installed at `C:\Program Files\nodejs`.
- Verified PowerShell needs Node prepended to `PATH` for child processes launched by Vite.
- Verified `npm.cmd` must be used instead of `npm` in this environment because `npm.ps1` is blocked by execution policy.
- Verified an unsandboxed `npm run dev -- --host 0.0.0.0` stays alive instead of failing immediately, which is consistent with the dev server starting normally.
- Rewrote `docs/state.md` to reflect the verified startup path for local and mobile testing.
