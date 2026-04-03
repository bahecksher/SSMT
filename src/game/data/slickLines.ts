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
    "You're in Slick's yard now - Try not to decorate it with your hull.",
    "Ready to get paid? Let's Go",
    'Two rules: stay alive and get paid.',
  ],
  runStart: [
    'Eyes up, pilot.',
    "Let's see if you're all talk.",
    'Nice and steady.',
    "Panic doesn't pay.",
  ],
  phaseAdvance: [
    'Get it done, pilot.',
    "You're still here. Good.",
  ],
  gateOpen: [
    "Gate's live, pilot. Get out or get greedy.",
    "Door's open, pilot. Smart money knows when to leave...",
    'Got the green light home. You taking it?',
  ],
  gateClose: [
    'Make mama proud.',
    "Same thing I'd do.",
    'Greedy. I like it.',
    'Bold choice, pilot.',
    'More guts than sense. Respect.',
    "That's the spirit. Let's go.",
  ],
  hazardDeath: [
    'Next time, tuck it in, cowpoke.',
    'Bit late to dodge now. Line up another run.',
    'Go earn it back.',
    'Rough hit. Tighten it up.',
  ],
  shieldPickup: [
    'Good grab. No refunds.',
    "Insurance acquired. Don't test the policy.",
  ],
  extraction: [
    "Now that's a payday. Clean run.",
    "That's how you leave the field: Richer.",
    "Money's banked. Well done.",
  ],
  death: [
    "Well. That'll do it.",
    'Shake it off, pilot.',
    'Ugly stuff. Useful lesson.',
  ],
  gameOverRetry: [
    'Good pilots are built out of reruns... and embarrassment.',
    "You've still got a ship-shaped point to prove.",
    'Get back in the seat, pilot.',
  ],
};

import { createLinePicker } from '../utils/linePicker';

export const getSlickLine = createLinePicker(SLICK_LINES);
