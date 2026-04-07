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
  | 'gameOverRetry';

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
};

import { createLinePicker } from '../utils/linePicker';

export const getSlickLine = createLinePicker(SLICK_LINES);
