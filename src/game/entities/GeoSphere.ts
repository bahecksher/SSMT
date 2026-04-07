import Phaser from 'phaser';
import { COLORS } from '../constants';
import { getLayout } from '../layout';

/** Number of subdivisions of the icosphere (higher = more triangles). */
const SUBDIVISIONS = 2;
const SPIN_SPEED = 0.006; // radians per second around Y axis
const TILT_SPEED = 0.002; // very slow wobble around X axis
const RING_INNER_RADIUS = 1.25;
const RING_OUTER_RADIUS = 1.95;
const RING_TILT = 0.28;
const RING_SEGMENTS = 160;
const RING_DEBRIS_STEP = 1;
const RING_COLOR = 0xc7d2de;
const RING_SCREEN_OFFSET_Y = -0.09;
/** Global opacity multiplier so the ring reads as background, not gameplay. */
const RING_ALPHA_MULT = 0.35;

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Generates an icosphere: vertices + edge pairs. */
function buildIcosphere(subdivisions: number): { verts: Vec3[]; edges: [number, number][] } {
  const t = (1 + Math.sqrt(5)) / 2;

  const rawVerts: Vec3[] = [
    { x: -1, y: t, z: 0 }, { x: 1, y: t, z: 0 }, { x: -1, y: -t, z: 0 }, { x: 1, y: -t, z: 0 },
    { x: 0, y: -1, z: t }, { x: 0, y: 1, z: t }, { x: 0, y: -1, z: -t }, { x: 0, y: 1, z: -t },
    { x: t, y: 0, z: -1 }, { x: t, y: 0, z: 1 }, { x: -t, y: 0, z: -1 }, { x: -t, y: 0, z: 1 },
  ];

  // Normalize to unit sphere
  for (const v of rawVerts) {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    v.x /= len; v.y /= len; v.z /= len;
  }

  let faces: [number, number, number][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  const midpointCache = new Map<string, number>();
  function getMidpoint(a: number, b: number): number {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    const cached = midpointCache.get(key);
    if (cached !== undefined) return cached;
    const va = rawVerts[a];
    const vb = rawVerts[b];
    const mid: Vec3 = {
      x: (va.x + vb.x) / 2,
      y: (va.y + vb.y) / 2,
      z: (va.z + vb.z) / 2,
    };
    const len = Math.sqrt(mid.x * mid.x + mid.y * mid.y + mid.z * mid.z);
    mid.x /= len; mid.y /= len; mid.z /= len;
    const idx = rawVerts.length;
    rawVerts.push(mid);
    midpointCache.set(key, idx);
    return idx;
  }

  for (let s = 0; s < subdivisions; s++) {
    const newFaces: [number, number, number][] = [];
    for (const [a, b, c] of faces) {
      const ab = getMidpoint(a, b);
      const bc = getMidpoint(b, c);
      const ca = getMidpoint(c, a);
      newFaces.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = newFaces;
  }

  // Collect unique edges from faces
  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];
  for (const [a, b, c] of faces) {
    for (const [i, j] of [[a, b], [b, c], [c, a]] as [number, number][]) {
      const key = i < j ? `${i}_${j}` : `${j}_${i}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push([i, j]);
      }
    }
  }

  return { verts: rawVerts, edges };
}

function rotateY(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x * cos + v.z * sin, y: v.y, z: -v.x * sin + v.z * cos };
}

function rotateX(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x, y: v.y * cos - v.z * sin, z: v.y * sin + v.z * cos };
}

export class GeoSphere {
  private graphic: Phaser.GameObjects.Graphics;
  private baseVerts: Vec3[];
  private edges: [number, number][];
  private angleY = 0;
  private angleX = 0.35; // initial tilt
  private radius: number;

  private originX: number;
  private originY: number;

  constructor(scene: Phaser.Scene) {
    const { verts, edges } = buildIcosphere(SUBDIVISIONS);
    this.baseVerts = verts;
    this.edges = edges;

    const layout = getLayout();
    // Large sphere tucked deep into the bottom-right corner — only a sliver visible
    this.radius = Math.min(layout.gameWidth, layout.gameHeight) * 1.1;
    this.originX = layout.gameWidth + this.radius * 0.35;
    this.originY = layout.gameHeight + this.radius * 0.25;

    this.graphic = scene.add.graphics().setDepth(-0.5);
    this.draw();
  }

  update(delta: number): void {
    const dt = delta / 1000;
    this.angleY += SPIN_SPEED * dt;
    this.angleX = 0.35 + Math.sin(this.angleY * (TILT_SPEED / SPIN_SPEED)) * 0.15;
    this.draw();
  }

  private draw(): void {
    const g = this.graphic;
    const cx = this.originX;
    const cy = this.originY;
    const r = this.radius;

    g.clear();

    // Project rotated vertices to 2D
    const projected: { x: number; y: number; z: number }[] = [];
    for (const v of this.baseVerts) {
      const ry = rotateY(v, this.angleY);
      const rxz = rotateX(ry, this.angleX);
      projected.push({
        x: cx + rxz.x * r,
        y: cy + rxz.y * r,
        z: rxz.z,
      });
    }

    const projectRing = (radiusScale: number): { x: number; y: number; z: number }[] => {
      const points: { x: number; y: number; z: number }[] = [];
      for (let i = 0; i <= RING_SEGMENTS; i++) {
        const angle = (i / RING_SEGMENTS) * Math.PI * 2;
        const radiusJitter = 1 + Math.sin(angle * 5 + 0.8) * 0.008;
        const base: Vec3 = {
          x: Math.cos(angle) * radiusScale * radiusJitter,
          y: 0,
          z: Math.sin(angle) * radiusScale * radiusJitter,
        };
        const tilted = rotateX(base, RING_TILT);
        const spun = rotateY(tilted, this.angleY * 0.52 + 0.42);
        const wobbled = rotateX(spun, this.angleX);
        points.push({
          x: cx + wobbled.x * r,
          y: cy + (wobbled.y + RING_SCREEN_OFFSET_Y) * r,
          z: wobbled.z,
        });
      }
      return points;
    };

    const ringInner = projectRing(RING_INNER_RADIUS);
    const ringOuter = projectRing(RING_OUTER_RADIUS);
    const ringMid = projectRing((RING_INNER_RADIUS + RING_OUTER_RADIUS) * 0.5);

    const drawRingBand = (front: boolean): void => {
      for (let i = 0; i < ringInner.length - 1; i++) {
        const innerA = ringInner[i];
        const innerB = ringInner[i + 1];
        const outerA = ringOuter[i];
        const outerB = ringOuter[i + 1];
        const avgZ = (innerA.z + innerB.z + outerA.z + outerB.z) / 4;
        if ((avgZ >= 0) !== front) continue;

        const alpha = (front
          ? 0.014 + Math.max(0, avgZ) * 0.02
          : 0.004 + Math.max(0, avgZ + 1) * 0.008) * RING_ALPHA_MULT;
        g.fillStyle(RING_COLOR, alpha);
        g.beginPath();
        g.moveTo(innerA.x, innerA.y);
        g.lineTo(outerA.x, outerA.y);
        g.lineTo(outerB.x, outerB.y);
        g.lineTo(innerB.x, innerB.y);
        g.closePath();
        g.fillPath();
      }
    };

    const drawRingSegments = (points: { x: number; y: number; z: number }[], front: boolean, color: number): void => {
      for (let i = 0; i < points.length - 1; i++) {
        const pa = points[i];
        const pb = points[i + 1];
        const avgZ = (pa.z + pb.z) / 2;
        if ((avgZ >= 0) !== front) continue;
        const alpha = (front
          ? 0.075 + Math.max(0, avgZ) * 0.08
          : 0.022 + Math.max(0, avgZ + 1) * 0.03) * RING_ALPHA_MULT;
        g.lineStyle(front ? 1.15 : 1, color, alpha);
        g.lineBetween(pa.x, pa.y, pb.x, pb.y);
      }
    };

    const drawRingDebris = (front: boolean): void => {
      for (let i = 0; i < ringMid.length - 1; i += RING_DEBRIS_STEP) {
        const point = ringMid[i];
        const next = ringMid[i + 1];
        if ((point.z >= 0) !== front) continue;

        const inner = ringInner[i];
        const outer = ringOuter[i];
        const laneT = 0.2 + ((Math.sin(i * 0.61 + 1.3) + 1) * 0.5) * 0.6;
        const baseX = inner.x + (outer.x - inner.x) * laneT;
        const baseY = inner.y + (outer.y - inner.y) * laneT;

        const tangentX = next.x - point.x;
        const tangentY = next.y - point.y;
        const tangentLen = Math.max(0.001, Math.sqrt(tangentX * tangentX + tangentY * tangentY));
        const tx = tangentX / tangentLen;
        const ty = tangentY / tangentLen;

        const bandX = outer.x - inner.x;
        const bandY = outer.y - inner.y;
        const bandLen = Math.max(0.001, Math.sqrt(bandX * bandX + bandY * bandY));
        const nx = bandX / bandLen;
        const ny = bandY / bandLen;

        const alpha = (front
          ? 0.18 + Math.max(0, point.z) * 0.15
          : 0.07 + Math.max(0, point.z + 1) * 0.05) * RING_ALPHA_MULT;
        const size = (front ? 2.5 : 1.7) * (0.8 + ((Math.sin(i * 0.73) + 1) * 0.5) * 0.95);
        g.fillStyle(RING_COLOR, alpha);
        g.fillCircle(baseX, baseY, size);

        const companionOffset = (((Math.sin(i * 1.11 + 0.4) + 1) * 0.5) - 0.5) * bandLen * 0.18;
        g.fillCircle(baseX + nx * companionOffset, baseY + ny * companionOffset, size * 0.58);

        if (i % (RING_DEBRIS_STEP * 2) === 0) {
          const shardLen = size * (1.6 + ((Math.sin(i * 0.37 + 0.2) + 1) * 0.5));
          const shardHalf = size * 0.42;
          const skew = (((Math.sin(i * 0.51 + 2.1) + 1) * 0.5) - 0.5) * size * 0.6;
          g.fillStyle(RING_COLOR, alpha * 0.9);
          g.beginPath();
          g.moveTo(baseX - tx * shardLen * 0.6 - nx * shardHalf, baseY - ty * shardLen * 0.6 - ny * shardHalf);
          g.lineTo(baseX - tx * shardLen * 0.12 + nx * (shardHalf + skew), baseY - ty * shardLen * 0.12 + ny * (shardHalf + skew));
          g.lineTo(baseX + tx * shardLen * 0.85 + nx * shardHalf * 0.3, baseY + ty * shardLen * 0.85 + ny * shardHalf * 0.3);
          g.lineTo(baseX + tx * shardLen * 0.08 - nx * (shardHalf - skew), baseY + ty * shardLen * 0.08 - ny * (shardHalf - skew));
          g.closePath();
          g.fillPath();
        }

        if (i % (RING_DEBRIS_STEP * 2) === 0) {
          g.lineStyle(front ? 1.15 : 0.9, RING_COLOR, alpha * 0.98);
          g.lineBetween(
            baseX - tx * size * 1.35,
            baseY - ty * size * 1.35,
            baseX + tx * size * 1.9,
            baseY + ty * size * 1.9,
          );
        }

        if (i % (RING_DEBRIS_STEP * 3) === 0) {
          const chunkBaseX = baseX + nx * (((Math.sin(i * 0.23 + 0.8) + 1) * 0.5) - 0.5) * bandLen * 0.35;
          const chunkBaseY = baseY + ny * (((Math.sin(i * 0.23 + 0.8) + 1) * 0.5) - 0.5) * bandLen * 0.35;
          const chunkLen = size * (1.1 + ((Math.sin(i * 0.31 + 1.4) + 1) * 0.5) * 1.2);
          const chunkWidth = size * 0.7;
          const jag = size * 0.35;
          g.fillStyle(RING_COLOR, alpha * 0.95);
          g.beginPath();
          g.moveTo(chunkBaseX - tx * chunkLen - nx * chunkWidth, chunkBaseY - ty * chunkLen - ny * chunkWidth);
          g.lineTo(chunkBaseX - tx * chunkLen * 0.15 + nx * (chunkWidth + jag), chunkBaseY - ty * chunkLen * 0.15 + ny * (chunkWidth + jag));
          g.lineTo(chunkBaseX + tx * chunkLen + nx * chunkWidth * 0.25, chunkBaseY + ty * chunkLen + ny * chunkWidth * 0.25);
          g.lineTo(chunkBaseX + tx * chunkLen * 0.1 - nx * (chunkWidth + jag * 0.5), chunkBaseY + ty * chunkLen * 0.1 - ny * (chunkWidth + jag * 0.5));
          g.closePath();
          g.fillPath();
        }

        if (i % (RING_DEBRIS_STEP * 4) === 0) {
          const edgeOffset = (((Math.sin(i * 0.29 + 1.7) + 1) * 0.5) - 0.5) * bandLen * 0.55;
          const edgeX = baseX + nx * edgeOffset;
          const edgeY = baseY + ny * edgeOffset;
          g.fillStyle(RING_COLOR, alpha * 0.82);
          g.fillCircle(edgeX, edgeY, size * 0.48);
        }
      }
    };

    drawRingBand(false);
    drawRingSegments(ringOuter, false, RING_COLOR);
    drawRingSegments(ringInner, false, RING_COLOR);
    drawRingDebris(false);

    g.fillStyle(COLORS.NPC, 0.16);
    g.fillCircle(cx, cy, r);

    // Draw edges with depth-based alpha
    for (const [a, b] of this.edges) {
      const pa = projected[a];
      const pb = projected[b];
      const avgZ = (pa.z + pb.z) / 2;
      // Map z from [-1,1] to alpha range — back edges dimmer
      const alpha = 0.08 + (avgZ + 1) * 0.10;
      g.lineStyle(1, COLORS.NPC, alpha);
      g.lineBetween(pa.x, pa.y, pb.x, pb.y);
    }

    drawRingBand(true);
    drawRingSegments(ringOuter, true, RING_COLOR);
    drawRingSegments(ringInner, true, RING_COLOR);
    drawRingDebris(true);
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
