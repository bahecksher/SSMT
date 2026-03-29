# Plan revision - Mission System Economy
_Created: 2026-03-29 0053_
_Revises: docs/plans/2026-03-28 2357 Plan revision - Mission System Economy.md_

## What changed
- MissionSelect now needs denser contract cards instead of only spacing tweaks.
- Company standing and liaison detail now need to be visible directly on the favor cards.
- Slick's flat 65% cut is replaced with a progressive deal that improves with cumulative career banked credits.

## Why
- The old contract cards still wasted too much height on phones.
- Rep and favor unlocks were meaningful, but the screen still hid too much of the company context.
- A fixed Slick cut made progression feel static even after repeated successful extractions.

## Updated approach
- Rebuild the mission card content layout so label, company, and reward fit in a tighter vertical footprint.
- Expand favor cards into mini company status panels: liaison, standing, next threshold, offer, and affordability state.
- Persist `careerBankedCredits` in save data and use tiered payout thresholds to compute wallet share and Slick's cut.
- Surface the active deal in both MissionSelect and extraction results so the progression is always legible.
