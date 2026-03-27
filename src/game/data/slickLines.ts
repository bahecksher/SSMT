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
    "You're in Slick's yard now. Try not to decorate it with your hull.",
    'Training module is hot. Earn clean, extract cleaner.',
    "I teach two things here: staying alive and getting paid.",
  ],
  runStart: [
    'Eyes up, pilot. The field never misses a lazy turn.',
    "Let's see if you've got hands or just opinions.",
    'Nice and steady. Panic is expensive.',
  ],
  phaseAdvance: [
    "Field's getting meaner. Keep your nose clean.",
    'That gate shut for a reason. The next minute bites harder.',
    "You're still here. Good. Don't get proud about it.",
  ],
  gateOpen: [
    "Gate's live. Cash out or get greedy. Your call.",
    'Door is open, pilot. Smart money knows when to leave.',
    "You've got an exit. Whether you've got discipline is another matter.",
  ],
  gateClose: [
    'Make mama proud.',
    "Same thing I'd do.",
    "Greedy. I like it.",
    "Bold choice, pilot.",
    "More guts than sense. Respect.",
    "That's the spirit. Or the stupidity. Either way.",
  ],
  hazardDeath: [
    'Next time, tuck it in, cowboy.',
    "Bit late to dodge now. Learn it and line up another run.",
    "That's the field taking your lunch money. Go earn it back.",
    'Rough hit. Better here than in real vacuum. Tighten it up.',
  ],
  shieldPickup: [
    "That's a shield. Try not to spend it immediately.",
    'Good grab. One free mistake, no refunds.',
    "Insurance acquired. Don't test the policy on purpose.",
  ],
  extraction: [
    "Now that's a payday. Clean run.",
    "That's how you leave a wreck field: richer than you arrived.",
    "Money's banked. You're learning.",
  ],
  death: [
    'Well. That asteroid just filed a complaint about your parking.',
    'Shake it off, pilot. Better to learn in the sim than out in the black.',
    'Ugly end. Useful lesson.',
  ],
  gameOverRetry: [
    'Again. Good pilots are built out of reruns and embarrassment.',
    "You've still got a ship-shaped point to prove.",
    "Back in the seat when you're ready.",
  ],
};

const lastLineByKey = new Map<SlickLineKey, string>();

export function getSlickLine(key: SlickLineKey): string {
  const lines = SLICK_LINES[key];
  const previous = lastLineByKey.get(key);
  const options = lines.length > 1 && previous ? lines.filter((line) => line !== previous) : lines;
  const line = options[Math.floor(Math.random() * options.length)] ?? lines[0];
  lastLineByKey.set(key, line);
  return line;
}
