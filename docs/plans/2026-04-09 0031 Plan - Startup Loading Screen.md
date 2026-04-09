# Plan - Startup Loading Screen
_Created: 2026-04-09 0031_

## Goal
Show a real loading screen during browser startup so the game no longer feels blank or frozen while startup assets load.

## Approach
- Render a lightweight boot-time backdrop in `BootScene` using the existing starfield palette and `GeoSphere` globe/ring.
- Add a centered loading panel with status text and a progress bar driven by Phaser loader progress.
- Keep the same boot screen visible through the post-load font sync delay, then hand off to `MenuScene`.
- Verify the change with `npm.cmd run build`.

## Scope boundaries
- No gameplay or progression changes
- No redesign of MenuScene or MissionSelectScene
- No asset-pipeline or audio-file changes

## Open questions
- Whether especially slow devices still need a DOM-level pre-JS loading shell before Phaser starts
