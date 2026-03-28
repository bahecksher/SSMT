import Phaser from 'phaser';
import { getLayout } from '../layout';

/** Number of fragments a destroyed ship breaks into. */
const FRAGMENT_COUNT = 3;
/** How long fragments live before fading (ms). */
const FRAGMENT_LIFETIME = 1000;
/** Extra random scatter speed added to inherited velocity. */
const SCATTER_SPEED = 60;
/** Spin speed range (radians / sec). */
const SPIN_MIN = 2;
const SPIN_MAX = 8;

interface Fragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  size: number;
  /** 0-1 normalized shape seed so each fragment looks different */
  shape: number;
}

/**
 * Visual-only ship breakup effect. Spawns small wireframe fragments
 * that inherit the ship's velocity and scatter outward, then fade and
 * self-destruct.
 */
export class ShipDebris {
  private graphic: Phaser.GameObjects.Graphics;
  private fragments: Fragment[] = [];
  private elapsed = 0;
  private color: number;
  active = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: number,
    radius: number,
  ) {
    this.color = color;
    this.graphic = scene.add.graphics().setDepth(6);

    for (let i = 0; i < FRAGMENT_COUNT; i++) {
      const scatterAngle = (Math.PI * 2 * i) / FRAGMENT_COUNT + Phaser.Math.FloatBetween(-0.4, 0.4);
      const scatterMag = Phaser.Math.FloatBetween(SCATTER_SPEED * 0.4, SCATTER_SPEED);
      this.fragments.push({
        x,
        y,
        vx: vx + Math.cos(scatterAngle) * scatterMag,
        vy: vy + Math.sin(scatterAngle) * scatterMag,
        angle: Phaser.Math.FloatBetween(0, Math.PI * 2),
        spin: Phaser.Math.FloatBetween(SPIN_MIN, SPIN_MAX) * (Math.random() < 0.5 ? 1 : -1),
        size: Phaser.Math.FloatBetween(radius * 0.2, radius * 0.5),
        shape: Math.random(),
      });
    }
  }

  update(delta: number): void {
    if (!this.active) return;

    const dt = delta / 1000;
    this.elapsed += delta;

    if (this.elapsed >= FRAGMENT_LIFETIME) {
      this.active = false;
      return;
    }

    const alpha = 1 - this.elapsed / FRAGMENT_LIFETIME;
    const g = this.graphic;
    g.clear();

    const layout = getLayout();
    for (const f of this.fragments) {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.angle += f.spin * dt;

      // Skip drawing if offscreen
      if (f.x < -50 || f.x > layout.gameWidth + 50 || f.y < -50 || f.y > layout.gameHeight + 50) continue;

      g.lineStyle(1.2, this.color, alpha * 0.85);

      const s = f.size;
      const cos = Math.cos(f.angle);
      const sin = Math.sin(f.angle);

      if (f.shape < 0.33) {
        // Triangle fragment
        const pts: [number, number][] = [
          [s, 0], [-s * 0.5, s * 0.7], [-s * 0.5, -s * 0.7],
        ];
        this.drawPoly(g, f.x, f.y, cos, sin, pts, alpha);
      } else if (f.shape < 0.66) {
        // Line/shard fragment
        const pts: [number, number][] = [
          [s, s * 0.15], [-s * 0.8, s * 0.3], [-s * 0.6, -s * 0.25],
        ];
        this.drawPoly(g, f.x, f.y, cos, sin, pts, alpha);
      } else {
        // Quad fragment
        const pts: [number, number][] = [
          [s * 0.8, s * 0.2], [0, s * 0.6], [-s * 0.7, 0], [0, -s * 0.5],
        ];
        this.drawPoly(g, f.x, f.y, cos, sin, pts, alpha);
      }
    }
  }

  private drawPoly(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    cos: number,
    sin: number,
    pts: [number, number][],
    alpha: number,
  ): void {
    g.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const rx = pts[i][0] * cos - pts[i][1] * sin + cx;
      const ry = pts[i][0] * sin + pts[i][1] * cos + cy;
      if (i === 0) g.moveTo(rx, ry);
      else g.lineTo(rx, ry);
    }
    g.closePath();
    g.strokePath();

    // Subtle fill
    g.fillStyle(this.color, alpha * 0.06);
    g.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const rx = pts[i][0] * cos - pts[i][1] * sin + cx;
      const ry = pts[i][0] * sin + pts[i][1] * cos + cy;
      if (i === 0) g.moveTo(rx, ry);
      else g.lineTo(rx, ry);
    }
    g.closePath();
    g.fillPath();
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
