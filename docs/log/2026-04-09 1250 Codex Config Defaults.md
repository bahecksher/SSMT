# 2026-04-09 1250 Codex Config Defaults

## TL;DR
- What changed: Updated `C:\Users\brett\.codex\config.toml` to default to a `dangerous` profile with `approval_policy = "never"`, `sandbox_mode = "danger-full-access"`, `model_reasoning_effort = "high"`, and `web_search = true`
- Why: The user asked for Codex itself to default to dangerous execution, high reasoning, and web search
- What didn't work: No project source files needed changes, so this session only touched Codex home config plus the required project docs
- Next: Restart Codex so new sessions pick up the updated default profile

---

## Full notes

- Backed up the previous home config to `C:\Users\brett\.codex\config.toml.bak`
- Added `profile = "dangerous"` and a matching `[profiles.dangerous]` section so the dangerous defaults are explicit in `config.toml`
- Verified the saved TOML by reading the file back and running `codex --help` successfully
- Repository gameplay files were not changed in this session
