# Spec - Campaign and Arcade Modes
_Created: 2026-04-06 2152_

## Goal
Add a menu-selectable run mode split so campaign and arcade use different progression rules while sharing the existing mission-to-gameplay flow.

## Requirements
- The main menu must let the player choose between `CAMPAIGN` and `ARCADE` before starting.
- The selected mode should persist so returning to the menu keeps the current choice visible.
- Campaign mode starts a campaign with 2 lives.
- Campaign mode needs its own persistent wallet balance for Mission Select spending.
- Arcade mode needs its own persistent wallet balance for Mission Select spending.
- Mission Select wallet readouts and wallet-backed spending should use the active mode's wallet.
- Arcade runs keep the current favor behavior: chosen favors are bought for that run and do not persist after the run ends.
- Campaign runs must keep purchased favors across later runs in the same campaign.
- In campaign mode, carried favors only clear on true game over, meaning when the campaign runs out of lives.
- Campaign mode should surface remaining lives so the player can tell whether the next death ends the campaign.
- Leaderboard score and loss submission must only happen in arcade mode.

## Out of scope
- New mission types, mission reward tuning, or separate mission pools per mode
- Rebalancing favor prices or boost values
- Reworking the existing leaderboard UI beyond what is needed to communicate arcade eligibility
