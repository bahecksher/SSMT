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
    'Gate is shut. Now endure the part where this gets difficult.',
    'No exit for you. Stay and watch your odds collapse.',
    'Door sealed. Good. Running was beginning to embarrass you.',
  ],
  killTaunt: [
    'All that and nothing to show for it.',
    'Predictable. You lot all break eventually.',
    'Stay down.',
    "You lasted just long enough to disappoint yourself.",
  ],
  whyWontYouDie: [
    "Why won't you DIE?!",
    'Still here?! IMPOSSIBLE.',
    "What ARE you?",
    'You are the most annoying scavenger I have EVER encountered.',
    'Fire Everything - EVERYTHING',
  ],
};

const lastLineByKey = new Map<RegentLineKey, string>();

export function getRegentLine(key: RegentLineKey): string {
  const lines = REGENT_LINES[key];
  const previous = lastLineByKey.get(key);
  const options = lines.length > 1 && previous ? lines.filter((line) => line !== previous) : lines;
  const line = options[Math.floor(Math.random() * options.length)] ?? lines[0];
  lastLineByKey.set(key, line);
  return line;
}
