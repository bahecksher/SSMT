/**
 * Pick a random line from a keyed set, avoiding the most recently used line
 * for the same key so the same line never plays twice in a row.
 */
export function createLinePicker<K extends string>(
  lines: Record<K, string[]>,
): (key: K) => string {
  const lastByKey = new Map<K, string>();

  return (key: K): string => {
    const pool = lines[key];
    const previous = lastByKey.get(key);
    const options = pool.length > 1 && previous ? pool.filter(l => l !== previous) : pool;
    const line = options[Math.floor(Math.random() * options.length)] ?? pool[0];
    lastByKey.set(key, line);
    return line;
  };
}
