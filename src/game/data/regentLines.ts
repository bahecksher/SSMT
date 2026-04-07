export type RegentLineKey =
  | 'threatDetected'
  | 'enemyEnter'
  | 'beamUnlock'
  | 'bossEnter'
  | 'gateClose'
  | 'killTaunt'
  | 'whyWontYouDie';

const REGENT_LINES: Record<RegentLineKey, string[]> = {
  threatDetected: [
    'Off-world interface detected. Investigating.',
    'Ring-lane intrusion detected. Dispatching patrol.',
  ],
  enemyEnter: [
    'Tortuga is closed. Leave now or be erased.',
    'Regent project territory. You have zero seconds to comply.',
    'Scrap diver, you are done here.',
    'This sky belongs to Regent. Die.',
    'Attention, scavenger. You are dead.',
  ],
  beamUnlock: [
    'Protect the assembly sites. Burn them out.',
    'Keep the ring lanes clear. Fire the lances.',
    "Should've left when you had the chance.",
  ],
  bossEnter: [
    'Gunship online. Sweep the perimeter and erase them!',
    'Edge batteries hot. Burn it all!.',
    'You wanted this.',
  ],
  gateClose: [
    'No where to run.',
    'Nothing leaves.',
    'Come out come out where ever you are..',
  ],
  killTaunt: [
    'All that and nothing to show for it.',
    'Predictable.',
    'Stay down.',
    "I'm Disappointed.",
  ],
  whyWontYouDie: [
    "Why won't you DIE?!",
    'Still here, pilot?!',
    'You are delaying our project.',
    'Fire everything. Assembly must continue!',
  ],
};

import { createLinePicker } from '../utils/linePicker';

export const getRegentLine = createLinePicker(REGENT_LINES);
