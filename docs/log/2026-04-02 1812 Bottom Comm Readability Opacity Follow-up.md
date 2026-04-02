# 2026-04-02 1812 Bottom Comm Readability Opacity Follow-up

## TL;DR
- What changed: Increased the compact bottom comm panel fill opacity across Slick, Regent, and liaison comms
- Why: The previous transparency pass made the messages too hard to read during live gameplay
- What didn't work: `0.68` panel alpha was too light for reliable text readability over active arena motion
- Next: Playcheck whether this revised opacity is the right balance or whether the next improvement should come from trimming panel width instead

---

## Full notes

Raised the compact bottom comm background alpha from `0.68` to `0.8` in all three gameplay comm panel implementations. This keeps the slimmer bottom treatment while giving the text a more stable backdrop.

Validation: `npm.cmd run build`
