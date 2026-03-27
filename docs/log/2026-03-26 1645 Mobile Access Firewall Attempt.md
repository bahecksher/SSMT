# 2026-03-26 1645 Mobile Access Firewall Attempt

## TL;DR
- What changed: Confirmed the PC LAN address for phone testing and attempted to add a Windows Firewall rule for Vite port `5173`.
- Why: The app is already configured for LAN access, so the remaining likely blocker is inbound firewall access from the phone.
- What didn't work: Creating the firewall rule from this session failed with Windows "Access is denied", which indicates admin elevation is required on the host machine.
- Next: Run the firewall command manually from an Administrator PowerShell, then retry `http://192.168.1.192:5173` on the phone.

---

## Full notes

- Verified `vite.config.ts` already uses `server.host = true`, so Vite is configured to bind on the LAN.
- Confirmed the active Wi-Fi IPv4 address is `192.168.1.192`.
- Confirmed the intended phone URL is `http://192.168.1.192:5173`.
- Attempted to add an inbound firewall rule with:
  `New-NetFirewallRule -DisplayName 'Bit-P-AI-lot Vite 5173' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173`
- Windows rejected the firewall change with "Access is denied", so the remaining action must be done from an elevated/admin PowerShell session outside this tooling context.
- Updated `docs/state.md` with the confirmed next step and verification path.
