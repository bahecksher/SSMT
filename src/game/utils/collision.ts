/**
 * Point-in-polygon test using ray casting algorithm.
 * Tests if point (px, py) is inside the polygon defined by vertices.
 * Vertices are in world space as [x, y] pairs.
 */
export function pointInPolygon(
  px: number,
  py: number,
  vertices: [number, number][],
): boolean {
  let inside = false;
  const n = vertices.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = vertices[i][0];
    const yi = vertices[i][1];
    const xj = vertices[j][0];
    const yj = vertices[j][1];

    if (
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
}
