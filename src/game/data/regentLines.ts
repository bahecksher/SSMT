export type RegentLineKey =
  | 'enemyEnter'
  | 'beamUnlock'
  | 'whyWontYouDie';

const REGENT_LINES: Record<RegentLineKey, string[]> = {
  enemyEnter: [
    'This is a restricted zone. Leave now or be removed.',
    "Unregistered vessel detected. You have exactly zero seconds to comply.",
    'Regent Patrol to trespasser: prepare for destruction.',
    "You're salvaging in MY sector? That's a death sentence, pilot.",
    'Attention, scavenger. Your license has been... revoked.',
  ],
  beamUnlock: [
    "Bring out the big guns. It's time to end this.",
    "Activating heavy ordnance. Should've left when you had the chance.",
    'All batteries, full sweep. Burn them out.',
  ],
  whyWontYouDie: [
    "Why won't you DIE?!",
    'Still here?! IMPOSSIBLE.',
    "How are you still flying?! This is ABSURD.",
    "What ARE you? Nothing survives this long!",
    "My superiors are going to hear about this. And they won't be happy.",
    'You are the most annoying scavenger I have EVER encountered.',
    "Every phase you survive costs me a promotion. STOP THAT.",
    "I've thrown everything at you. EVERYTHING. What's your secret?!",
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
