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
    'Off-world interference detected over Tortuga. Investigating.',
    'Ring-lane intrusion detected. Dispatching patrol.',
  ],
  enemyEnter: [
    'Tortuga is closed. Leave now or be erased.',
    'Regent project territory. You have zero seconds to comply.',
    'Scrap diver, you trespass above a sovereign world.',
    'This sky belongs to Regent. Die in it.',
    'Attention, scavenger. You are not welcome here.',
  ],
  beamUnlock: [
    'Protect the assembly sites. Burn them out.',
    'Keep the ring lanes clear. Fire the lances.',
    "Should've left when you had the chance.",
  ],
  bossEnter: [
    'Gunship online. Sweep the perimeter and erase the diver.',
    'Edge batteries hot. Let the scavenger burn against the wall.',
    'You wanted the next phase. Here it is.',
  ],
  gateClose: [
    'No where to go.',
    'Nothing leaves Tortuga.',
    'The project stays hidden.',
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
    'You are delaying the Regent project.',
    'Fire everything. The assembly must continue.',
  ],
};

import { createLinePicker } from '../utils/linePicker';

export const getRegentLine = createLinePicker(REGENT_LINES);
