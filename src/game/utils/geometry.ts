/** Rotate point (px, py) around the origin by `angle` radians. */
export function rotatePoint(px: number, py: number, angle: number): [number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [px * cos - py * sin, px * sin + py * cos];
}

/** Convert a numeric hex color (0xRRGGBB) to a CSS color string (#rrggbb). */
export function colorStr(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

/** Scale each RGB channel of a hex color by `factor` (0-1). */
export function darkenColor(hex: number, factor: number): number {
  const r = Math.floor(((hex >> 16) & 0xff) * factor);
  const g = Math.floor(((hex >> 8) & 0xff) * factor);
  const b = Math.floor((hex & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}
