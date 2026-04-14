# 2026-04-13 2352 Audio Compression

## TL;DR
- What changed: Converted the shipped music loops from `.wav` to compressed `ogg` and `mp3` files, updated the loader to use multi-format URLs, and removed the original WAVs from `public/audio`.
- Why: The active music payload was still about `175.42 MB`, which was much larger than necessary for the browser build.
- What didn't work: There was no local encoder available, so I had to temporarily pull in a local ffmpeg binary to perform the transcodes.
- Next: Cold-refresh and long-run browser validation to confirm the compressed loops still feel clean at startup and during phase transitions.

---

## Full notes

- The music tracks used by `MusicSystem` now resolve as `ogg` first with `mp3` fallback instead of hard-coded WAV URLs.
- The eight shipped music loop files now occupy about `31.35 MB` total across both compressed formats, down from about `175.42 MB` as WAVs.
- That reduces the shipped music footprint by about `144.07 MB` while preserving a fallback path for browsers with different codec support.
- `npm.cmd run build` passes after the asset swap.
