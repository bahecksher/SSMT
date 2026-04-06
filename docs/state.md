# State
_Last updated: 2026-04-06 1558_

## Current focus
Visual identity pass: shifting the game toward a blue-led main palette while tightening color alignment across threats, factions, Mission Select, and HUD layout.

## What's working
- Saved `paletteId` supports `GREEN`, `ORANGE`, `BLUE`, and `RED`, and the selected palette applies on boot
- Main menu settings panel has a palette cycle button; palette changes restart the menu with background handoff and reopen the panel for fast comparison
- Pause menu has a palette cycle button; palette changes refresh the board, HUD, pause chrome, and theme-sensitive entities without dropping the current run
- The blue palette is now the default lead direction for new/default settings, with deeper navy backgrounds and stronger blue-friendly UI colors
- In the blue palette, the enemy/globe/hazard side still uses warm orange tones, and the older yellow/gold accent thread has been restored across the HUD and menu chrome
- In the blue palette, Tortuga's globe now rides the same red threat thread as the NPCs, pulling the planet closer to the Regent/NPC faction identity
- Tortuga's globe now has a subtle filled body under the wireframe, so it reads more like a solid planet instead of only linework
- In the blue palette, the arena wall now uses the same yellow-gold accent thread as the menu/UI instead of the old blue wall color
- In the blue palette, the extraction gate now shares the player-blue thread instead of the older yellow gate accent, while UI buttons have been pushed back onto the yellow HUD thread so gameplay gate color and button color no longer fight each other
- Asteroids now sit on a deeper amber/copper thread and salvage in the blue palette has been pushed greener, with asteroid mining visuals following the asteroid color thread so the two reads separate more clearly in motion
- NPC ships now use a single red threat-thread hull color again, and that red read carries consistently through background handoff, gameplay, and debris
- Mining-bonus and standard credit-bonus pickups now share the same credits/salvage color thread as the top HUD `CREDITS` readout
- `RECLAIM CO` now uses the salvage-green thread for its company color styling
- The background globe stays tied to the enemy color thread with the cleaner wireframe treatment
- `pixel_lcd` now loads from `public/fonts/pixel_lcd_7.ttf` and is used for major title moments on Menu, Mission Select, pause, and results
- Mission Select now keeps its larger board headings on `pixel_lcd` while the smaller support copy uses `FreePixel` again so the screen reads less heavy
- Mission cards now replace the old `COMPANY +REP` footer with more narrative liaison-issued rationale lines that frame Tortuga, the shattered moon ring, company motives, and hints of Regent's larger project
- Mission Select favor cards now use geometric company logos instead of liaison portraits, giving the company row a cleaner faction-identity read
- Liaison comm panels now use the title font for the liaison name/title header while keeping the message body on the readable font
- Regent comm styling now uses the same red threat thread as the NPCs while keeping the brighter beam accents as a secondary contrast
- Slick, liaison, and Regent comm lines now reinforce the Tortuga setup, the remote pilot framing, and the idea that Regent is protecting a larger construction effort on the planet
- `FreePixel` now loads from `public/fonts/FreePixel.ttf` and is used as the general readable UI font across the game
- The top arena `CREDITS` and `BEST` labels now use the title font, while smaller support HUD text stays on the readable font
- The title screen portrait block now uses a larger pseudo-3D pilot craft that slowly spins instead of the static Slick portrait
- General UI text now gets a stronger low-end `readableFontSize` bump, and the bottom mission pills are larger to improve legibility
- The top-center `PHASE` label has been removed and the pause button now occupies that slot above the arena
- Mission Select now gives the wallet readout breathing room both above and below it, the `COMPANY // LIAISON:` line on favor cards now matches the larger mission-text sizing, and the favor cards themselves now slim down to the mission-card height class
- The pause menu panel now starts below the centered pause button and no longer shows the `RUN AT CRAWL // DANGER LIVE` subtitle
- Tortuga's background globe now includes a pale silver-blue broken orbital ring whose smooth band has been pushed way down so chunk, shard, and plate-like debris dominate the read, and the ring has been corrected from the broken overscale into a large visible sweep across more of the arena
- `npm.cmd run build` passes

## In progress
- Playtesting whether the blue-led palette, the Tortuga lore pass, and the new orbital ring give the game a stronger authored identity without hurting readability on compact screens

## Known issues
- Background simulation (~180 lines) duplicated between MenuScene and MissionSelectScene - candidate for extraction to a shared BackgroundSimulation class
- Settings UI duplicated across MenuScene, MissionSelectScene, and GameScene pause menu - candidate for a shared SettingsPanel component
- MissionSelect settings panel reflects the saved palette but does not expose the new palette cycle control yet
- Browser autoplay restrictions still require initial player interaction before audio can become audible
- Soundtrack and SFX still need a real feel pass for balance, overlap, and loudness
- Retry after extraction still bypasses MissionSelect
- Beam hazards still span full screen width/height, not clipped to arena
- Regent's hinted larger build / boss encounter is only narrative setup right now; no boss encounter exists yet
- `node`/`npm` not on PowerShell PATH; use `npm.cmd` or set PATH explicitly
- Supabase `scores` still needs a nullable `company_id` column added server-side

## Next actions
1. Playtest the blue palette across menu, Mission Select, gameplay, and pause to confirm the restored gold accents improve readability and vibe without fighting the orange threat thread
2. Playtest the single-color red NPC read in motion to confirm it feels cleaner and more threatening against the blue-led board
3. Decide whether the hinted Regent build should next surface as more UI/story scaffolding or wait for the eventual boss encounter implementation

## Active plan
docs/plans/2026-04-06 1249 Plan revision - Palette Swap Preview.md

## How to verify
1. Run `npm.cmd run build`
2. Launch gameplay with the blue palette
3. Confirm NPC ships now all render on the same red threat thread in menu background, Mission Select background, gameplay, and debris
4. Confirm `RECLAIM CO` visuals read salvage-green in Mission Select and liaison contexts
5. Confirm NPC hulls feel visibly filled in rather than outline-only
6. Confirm Mission Select mission cards show narrative liaison rationale text in place of the old `COMPANY +REP` footer
7. Confirm menu/gameplay comm lines now reference Tortuga, the remote pilot framing, and Regent's larger project
8. Confirm the background globe now shows a broken orbital debris ring
9. Confirm Mission Select favor cards still show company logos instead of liaison portraits
10. Confirm asteroids still read as a brighter Deepcore-family amber distinct from the yellow HUD/button accents

## Recent logs
- docs/log/2026-04-06 1558 Globe Fill Pass.md - added a filled red planet body behind the Tortuga wireframe while preserving the ring layering
- docs/log/2026-04-06 1557 Globe Regent Red Alignment Pass.md - moved Tortuga and Regent comm styling onto the same red threat thread as the NPCs
- docs/log/2026-04-06 1555 Globe Ring Visibility Correction Pass.md - pulled the ring back from the literal overscale so it becomes visible again while staying larger than the earlier version
- docs/log/2026-04-06 1553 Globe Ring Overscale Pass.md - scaled the Tortuga ring up dramatically and increased its segment/debris density so it fills much more of the arena view
- docs/log/2026-04-06 1552 Liaison Comm Header Font Pass.md - moved the liaison comm header name/title line to the title font without changing Slick or Regent headers
- docs/log/2026-04-06 1551 Top HUD Title Font Pass.md - moved the top arena `CREDITS` and `BEST` labels to the title font while keeping smaller HUD text readable
- docs/log/2026-04-06 1550 Bonus Pickup Credit Color Pass.md - aligned both mining and standard credit bonus pickups to the same HUD credits color
- docs/log/2026-04-06 1549 NPC Single Threat Color Pass.md - removed the mixed NPC faction colors and returned every NPC ship to the single red threat read
- docs/log/2026-04-06 1546 Button Accent Split Pass.md - kept the extraction gate blue while moving menu, mission, pause, and result buttons back to the yellow HUD accent
- docs/log/2026-04-06 1541 Blue Gate Alignment Pass.md - changed the blue palette extraction gate to the same blue as the player icon
- docs/log/2026-04-06 1541 Salvage Asteroid Separation Pass.md - pushed salvage greener in the blue palette and moved asteroids onto a deeper consistent amber/copper thread
- docs/log/2026-04-06 1539 Globe Ring Position Pass.md - widened the Tortuga ring span and lifted it higher in the frame
- docs/log/2026-04-06 1538 Globe Heavy Debris Pass.md - increased Tortuga ring debris density and added larger irregular fragment shapes
- docs/log/2026-04-06 1537 Globe Ring Spacing Pass.md - moved the Tortuga ring slightly farther away from the globe while keeping its current thickness
- docs/log/2026-04-06 1536 Globe Debris Emphasis Pass.md - reduced the smooth ring swath and made chunk/shard debris much more prominent
- docs/log/2026-04-06 1534 Globe Bright Orange Pass.md - pushed Tortuga's globe color to a much brighter orange focal point
- docs/log/2026-04-06 1534 Globe Ring Debris Pass.md - added visible shard and chunk debris inside the Tortuga ring band
- docs/log/2026-04-06 1533 Globe Ring Width Pass.md - narrowed the Tortuga ring band for a cleaner ring silhouette
- docs/log/2026-04-06 1532 Globe Ring Readability Pass.md - pulled the Tortuga ring back toward the globe and flattened it so it reads more clearly as a ring
- docs/log/2026-04-06 1531 Blue Arena Wall Accent Pass.md - changed the blue palette arena wall to the same yellow-gold accent used across the menus
- docs/log/2026-04-06 1530 Globe Ring Scale Pass.md - enlarged and widened the Tortuga ring so it occupies much more of the screen
- docs/log/2026-04-06 1529 Globe Orange Brightness Pass.md - brightened the blue palette's Tortuga globe orange and the linked enemy-side orange thread
- docs/log/2026-04-06 1528 Globe Ring Color Transparency Pass.md - shifted the Tortuga ring to a unique pale silver-blue and made it much more transparent
- docs/log/2026-04-06 1527 Globe Ring Fill Pass.md - turned the Tortuga debris ring into a filled orbital band and adjusted it to cut across the globe more clearly
- docs/log/2026-04-06 1524 NPC Faction Color Pass.md - made NPC ships mostly red with smaller company-color variants and preserved their hull colors through scene handoff and debris
- docs/log/2026-04-06 1522 Tortuga Narrative Pass.md - expanded mission and comm text to carry the Tortuga story and added a visible debris ring to the globe
- docs/log/2026-04-06 1509 Mission Select Identity Pass.md - restored smaller Mission Select copy to the readable font, added liaison mission rationale text, and swapped favor portraits to company logos
- docs/log/2026-04-06 1503 Mission Board Title Font Pass.md - switched Mission Select board copy to the title font while leaving utility controls on the readable UI font
- docs/log/2026-04-06 1331 NPC Red Visibility Pass.md - shifted blue-palette NPCs to the red accent thread and gave the NPC hull a much stronger fill for readability
- docs/log/2026-04-06 1329 NPC Blue Alignment Pass.md - aligned blue-palette NPCs to the player blue and captured the Reclaim salvage-green color swap in project docs
- docs/log/2026-04-06 1326 Asteroid Amber Threat Pass.md - split asteroid color out from the generic hazard thread and tuned it toward brighter Deepcore amber
- docs/log/2026-04-06 1323 Mission Select Wallet Bottom Gap Pass.md - added matching breathing room below the wallet line
