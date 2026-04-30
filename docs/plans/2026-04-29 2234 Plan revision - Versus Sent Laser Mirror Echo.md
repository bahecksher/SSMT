# Plan revision - Versus Sent Laser Mirror Echo
_Created: 2026-04-29 2234_
_Revises: docs/plans/2026-04-29 2224 Plan - Versus Mirror Environment Detail.md_

## What changed
- Versus lasers fired by the local player now get an immediate mirror-only echo on the local peer backdrop.
- The echo is removed once the opponent's real mirror snapshot reports the matching versus laser lane.

## Why
- Waiting for the opponent to receive the laser and send a snapshot back can make the fired laser feel invisible or delayed on the sender's screen.
- The player should be able to see the laser on their own screen at the moment it fires on the opponent's screen.

## Updated approach
- Keep the original snapshot-backed opponent laser mirroring.
- Add local `MirrorLaserEcho` records for sent lanes.
- Tick echo warning/lethal timing locally using the existing versus laser timing constants.
- Reconcile echoes against peer snapshot laser data so the mirror does not double-draw the same lane longer than necessary.
