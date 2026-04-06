export type SlickLineKey =
  | 'menuIntro'
  | 'runStart'
  | 'phaseAdvance'
  | 'gateOpen'
  | 'gateClose'
  | 'hazardDeath'
  | 'shieldPickup'
  | 'extraction'
  | 'death'
  | 'gameOverRetry';

const SLICK_LINES: Record<SlickLineKey, string[]> = {
  menuIntro: [
    "Slick Ops. I thread your remote hull into Tortuga, you bring me back money.",
    'Hostile planet, dead fleets, easy credits. Welcome to Tortuga.',
    'I run the interface, you fly the shell, we split the payday.',
  ],
  runStart: [
    "Signal's clean. You're in over Tortuga now.",
    'Easy in, quick out. Do not let Regent pin you down.',
    'Remote shell is live. Make it earn.',
    "The sky's hostile and the link costs money. Move.",
  ],
  phaseAdvance: [
    "Tortuga's waking up. Keep the shell moving.",
    "You're still linked. Keep getting paid.",
  ],
  gateOpen: [
    "Gate's live, pilot. Cut the link or get greedy.",
    "Door's open. Smart money leaves Tortuga ahead of the patrols.",
    'Extraction window is up. You taking it?',
  ],
  gateClose: [
    'Greedy. I like it.',
    'Keeping the link hot. Bold choice.',
    'More guts than sense. That tracks.',
    "Same thing I'd do. Stay sharp.",
    "That's the spirit. Bleed them a little longer.",
    'Fine. One more pass through hell.',
  ],
  hazardDeath: [
    'Remote shell is gone. Lucky it was not your real bones.',
    'Bit late to dodge now. I can spool another shell.',
    'Tortuga got that one. Go earn it back.',
    'Rough hit. Tighten it up next run.',
  ],
  shieldPickup: [
    'Good grab. Tortuga charges extra for mistakes.',
    "Insurance acquired. Don't test the policy.",
  ],
  extraction: [
    "Now that's a payday. Link cut clean.",
    "That's how you leave Tortuga: richer and breathing.",
    "Money's banked. Regent gets nothing from that haul.",
  ],
  death: [
    'Well. Tortuga made its point.',
    'Shake it off, pilot. The link can be rebuilt.',
    'Ugly stuff. Useful lesson.',
  ],
  gameOverRetry: [
    'Good pilots are built out of reruns... and wreckage.',
    "You've still got a point to prove over Tortuga.",
    'Get back in the remote seat, pilot.',
  ],
};

import { createLinePicker } from '../utils/linePicker';

export const getSlickLine = createLinePicker(SLICK_LINES);
