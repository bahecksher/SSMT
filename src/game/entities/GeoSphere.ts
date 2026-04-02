import Phaser from 'phaser';
import { COLORS } from '../constants';
import { getLayout } from '../layout';

/** Number of subdivisions of the icosphere (higher = more triangles). */
const SUBDIVISIONS = 2;
const SPIN_SPEED = 0.006; // radians per second around Y axis
const TILT_SPEED = 0.002; // very slow wobble around X axis

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

    // Draw edges with depth-based alpha
    for (const [a, b] of this.edges) {
      const pa = projected[a];
      const pb = projected[b];
      const avgZ = (pa.z + pb.z) / 2;
      // Map z from [-1,1] to alpha range — back edges dimmer
      const alpha = 0.08 + (avgZ + 1) * 0.10;
      g.lineStyle(1, COLORS.ENEMY, alpha);
      g.lineBetween(pa.x, pa.y, pb.x, pb.y);
    }
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
