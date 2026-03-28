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

/**
 * Returns the squared distance from point (px, py) to the closest point
 * on the line segment from (ax, ay) to (bx, by).
 */
function distSqToSegment(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ex = px - ax;
    const ey = py - ay;
    return ex * ex + ey * ey;
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const cx = ax + t * dx - px;
  const cy = ay + t * dy - py;
  return cx * cx + cy * cy;
}

/**
 * Tests if a circle (cx, cy, radius) intersects a polygon.
 * True if the circle center is inside the polygon OR any polygon
 * edge is within `radius` of the center.
 */
export function circleIntersectsPolygon(
  cx: number,
  cy: number,
  radius: number,
  vertices: [number, number][],
): boolean {
  if (pointInPolygon(cx, cy, vertices)) return true;

  const rSq = radius * radius;
  const n = vertices.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    if (distSqToSegment(cx, cy, vertices[j][0], vertices[j][1], vertices[i][0], vertices[i][1]) <= rSq) {
      return true;
    }
  }
  return false;
}
