# Plan revision - Startup Loading Performance
_Created: 2026-04-13 2352_
_Revises: docs/plans/2026-04-13 2341 Plan revision - Startup Loading Performance.md_

## What changed
- Replaced the shipped music `.wav` files with compressed `ogg` and `mp3` variants
- Updated the music loader to provide both formats per track so Phaser can choose a supported file at runtime
- Removed the original large `.wav` payload from `public/audio`

## Why
- Lazy-loading reduced the startup bottleneck, but the shipped music assets were still far larger than they needed to be
- Looping music benefits from `ogg` where supported, while `mp3` remains a practical compatibility fallback

## Updated approach
- Keep the current lazy-load strategy and short boot hold
- Serve music as `ogg` first with `mp3` fallback for each track
- Validate that loop points still feel clean in real browsers after the transcode
