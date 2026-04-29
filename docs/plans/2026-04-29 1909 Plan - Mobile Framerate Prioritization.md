# Plan - Mobile Framerate Prioritization
_Created: 2026-04-29 1909_

## Goal
Reduce frame drops on iPhone 13 mini-sized viewports while preserving the current hologram-heavy visual direction and versus feature set.

## Approach
- Add a small-screen render profile so constrained phone-sized viewports can use lighter visual settings without changing desktop behavior.
- Cut the cost of always-on background rendering first: gameplay starfield cadence/count and the rotating geo-sphere detail/update rate.
- Throttle the mirrored-versus arena redraw so it better matches the 10 Hz snapshot stream instead of repainting a second vector arena every frame.
- Trim repeated dashed-ring detail on mineable asteroids and salvage radius visuals where the cost stacks up during active play.
- Build-verify, then hand off to a live phone playcheck for feel validation.

## Scope boundaries
- No broad gameplay-system rewrite or rendering-technology swap.
- No removal of versus systems, spectate tools, or the overall holo/vector art style.
- No new settings menu for performance tuning in this pass; this is an automatic constrained-viewport optimization.

## Open questions
- Whether the reduced mirror redraw cadence still feels smooth enough during live versus and spectate on phone.
- Whether the geo-sphere remains worth keeping in gameplay on constrained devices if the board still chugs under late-game load.
- Whether a follow-up should trim menu / briefing background simulation further, or if the current pass is enough.
