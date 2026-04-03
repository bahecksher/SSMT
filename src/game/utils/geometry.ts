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
