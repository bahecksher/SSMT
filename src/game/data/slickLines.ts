export type SlickLineKey =
  | 'menuIntro'
  | 'runStart'
  | 'phaseAdvance'
  | 'bossCoreExposed'
  | 'bossDestroyed'
  | 'gateOpen'
  | 'gateClose'
  | 'hazardDeath'
  | 'shieldPickup'
  | 'extraction'
  | 'death'
  | 'gameOverRetry'
  | 'tutMove'
  | 'tutMoveNudge'
  | 'tutMoveDone'
  | 'tutScore'
  | 'tutScoreNudge'
  | 'tutScoreDone'
  | 'tutDanger'
  | 'tutDangerNudge'
  | 'tutDangerDone'
  | 'tutDangerReset'
  | 'tutShield'
  | 'tutShieldNudge'
  | 'tutShieldHit'
  | 'tutShieldDone'
  | 'tutExtract'
  | 'tutExtractLive'
  | 'tutExtractDone'
  | 'tutComplete';

const SLICK_LINES: Record<SlickLineKey, string[]> = {
  menuIntro: [
    "Slick Ops. I provide the frames - you bring me back money.",
    'Hostile planet, dead fleets, easy credits. Welcome to Tortuga.',
    'I run the interface, you fly the frame, we split the payday.',
  ],
  runStart: [
    "Signal's clean. You're in - Get to it.",
    'Easy in and Hard out.',
    'Frame is live. Get going.',
    "The sky's hostile and this link costs money. Move.",
  ],
  phaseAdvance: [
    "Tortuga's waking up. Keep the frame moving.",
    "You're still linked. Keep getting paid.",
  ],
  bossCoreExposed: [
    "You've cracked the guns. Punch through the core!",
    'Core is open!',
    'Through the core, pilot!',
  ],
  bossDestroyed: [
    "Gunship down. More incomming!",
    'Nice kill!',
    'Gunship is scrap - Stay safe!',
  ],
  gateOpen: [
    "Gate's live, pilot. Get out or get greedy.",
    "Door's open. Smart money know when to leave.",
    'Extract gate is up. You taking it?',
  ],
  gateClose: [
    'Greedy. Good.',
    'Links still hot - Bold.',
    'More guts than sense. I like it.',
    "Same thing I'd do. Stay sharp.",
    "That's the spirit. Bleed them a little longer.",
    'Give them hell.',
  ],
  hazardDeath: [
    'Frame is gone, link is dead.',
    'Bit late to dodge now.',
    'Tortuga got that one. Go earn it back.',
    'Rough. Tighten it up next run.',
  ],
  shieldPickup: [
    'Tortuga charges extra for mistakes. Stay on your toes.',
    "Insurance acquired. Don't test the policy.",
  ],
  extraction: [
    "Now that's a payday. Link cut clean. Well done pilot.",
    "That's how you leave Tortuga: Well done pilot.",
    "Money's banked. Well done pilot.",
  ],
  death: [
    'Well. Tortuga made its point.',
    'Shake it off, pilot.',
    'Ugly but useful lesson.',
  ],
  gameOverRetry: [
    'Good pilots are built out of reruns... and wreckage.',
    "You've still got a point to prove. Get to it.",
    'Get back in the seat, pilot.',
  ],
  tutMove: [
    "Drag or hold the screen to move. Release and your ship will coast.",
  ],
  tutMoveNudge: [
    "Touch and hold anywhere on the arena to fly. Try moving around.",
  ],
  tutMoveDone: [
    "Good. Movement confirmed.",
  ],
  tutScore: [
    "Two ways to score: enter the GREEN ring to collect SALVAGE credits. Skim the YELLOW ring around the asteroid to MINE credits. Don't touch the asteroid itself.",
  ],
  tutScoreNudge: [
    "Fly into the green ring for salvage. Fly close to the asteroid (but not into it) for mining credits.",
  ],
  tutScoreDone: [
    "Both rings tested. Credits stay unbanked until you extract.",
  ],
  tutDanger: [
    "Asteroids and enemy ships will destroy you on contact. You have no shield. Survive.",
  ],
  tutDangerNudge: [
    "Keep moving. Don't let the asteroid or the enemy touch your ship.",
  ],
  tutDangerDone: [
    "You survived. Next: shields.",
  ],
  tutDangerReset: [
    "Your ship was destroyed. Respawning.",
  ],
  tutShield: [
    "Pick up the shield. It absorbs one hit before breaking. Use it on the asteroid to feel how it works.",
  ],
  tutShieldNudge: [
    "Grab the shield, then ram the asteroid. The shield will break instead of your ship.",
  ],
  tutShieldHit: [
    "That's a shield absorbing a hit. Grab the next shield and try again.",
  ],
  tutShieldDone: [
    "Shields buy you one mistake each. Don't rely on having one.",
  ],
  tutExtract: [
    "Credits are unbanked until you extract. The gate is warming up - fly through it once it goes live to bank.",
  ],
  tutExtractLive: [
    "Gate is live. Fly through it to bank your credits.",
  ],
  tutExtractDone: [
    "Banked.",
  ],
  tutComplete: [
    "That's the loop. Move, score, dodge, shield, extract. Go fly a real run when you're ready.",
  ],
};

import { createLinePicker } from '../utils/linePicker';

export const getSlickLine = createLinePicker(SLICK_LINES);
