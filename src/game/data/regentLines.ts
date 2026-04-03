export type RegentLineKey =
  | 'threatDetected'
  | 'enemyEnter'
  | 'beamUnlock'
  | 'gateClose'
  | 'killTaunt'
  | 'whyWontYouDie';

const REGENT_LINES: Record<RegentLineKey, string[]> = {
  threatDetected: [
    'Threat detected. Investigating.',
    'Anomalous activity in sector. Dispatching patrol.',
  ],
  enemyEnter: [
    'This is a restricted zone. Leave now or be removed.',
    "Unregistered vessel detected. You have zero seconds to comply.",
    'Regent Patrol to trespasser: Die rat.',
    "You're in MY sector? That's a death sentence, pilot.",
    'Attention, scavenger. Die.',
  ],
  beamUnlock: [
    "It's time to end this.",
    "Should've left when you had the chance.",
    'Burn them out.',
  ],
  gateClose: [
    'No where to go.',
    'No exit for you.',
    "Now here's the fun part",
  ],
  killTaunt: [
    'All that and nothing to show for it.',
    'Predictable.',
    'Stay down.',
    "I'm Disappointed.",
  ],
  whyWontYouDie: [
    "Why won't you DIE?!",
    'Still here Pilot?!',
    'You are the most annoying scavenger I have EVER encountered.',
    'Fire Everything - EVERYTHING',
  ],
};

import { createLinePicker } from '../utils/linePicker';

export const getRegentLine = createLinePicker(REGENT_LINES);
