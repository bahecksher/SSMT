import Phaser from 'phaser';
import { COLORS } from '../constants';
import {
  PLAYER_FOLLOW_SPEED,
  PLAYER_MAX_SPEED,
  PLAYER_RADIUS,
  PLAYER_DEAD_ZONE,
  PLAYER_DISTANCE_SCALE,
} from '../data/tuning';
import type { SwipeInput } from '../systems/InputSystem';
import { getLayout } from '../layout';

export class Player {
  graphic: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  hasShield = false;
  inverted = false;
  destroyed = false;

  private vx = 0;
  private vy = 0;
  private shieldPulse = 0;
  private heading = -Math.PI / 2; // default pointing up

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.graphic = scene.add.graphics();
    this.draw();
  }

  update(
    delta: number,
    target: { x: number; y: number } | null,
    swipe?: SwipeInput | null,
  ): void {
    const dt = delta / 1000;

    if (swipe && swipe.magnitude > 0) {
      // Mild curve (power 1.5): responsive mid-range, small drags still precise
      const curved = Math.pow(swipe.magnitude, 1.5);
      const desiredSpeed = curved * PLAYER_MAX_SPEED;
      const targetVx = swipe.dx * desiredSpeed;
      const targetVy = swipe.dy * desiredSpeed;

      // Responsive lerp that scales with drag
      const lerp = 0.10 + swipe.magnitude * 0.15;
      this.vx += (targetVx - this.vx) * lerp;
      this.vy += (targetVy - this.vy) * lerp;
    } else if (target) {
      // Desktop pointer-follow (unchanged)
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > PLAYER_DEAD_ZONE) {
        const desiredSpeed = Math.min(dist * PLAYER_DISTANCE_SCALE, PLAYER_MAX_SPEED);
        const targetVx = (dx / dist) * desiredSpeed;
        const targetVy = (dy / dist) * desiredSpeed;

        this.vx += (targetVx - this.vx) * PLAYER_FOLLOW_SPEED;
        this.vy += (targetVy - this.vy) * PLAYER_FOLLOW_SPEED;
      } else {
        this.vx *= 0.85;
        this.vy *= 0.85;
      }
    } else {
      // Very light friction — ship drifts but doesn't accumulate runaway speed
      this.vx *= 0.99;
      this.vy *= 0.99;
    }

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

    // Update heading to face direction of travel
    if (speed > 5) {
      this.heading = Math.atan2(this.vy, this.vx);
    }
    if (speed > PLAYER_MAX_SPEED) {
      const scale = PLAYER_MAX_SPEED / speed;
      this.vx *= scale;
      this.vy *= scale;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const layout = getLayout();
    this.x = Phaser.Math.Clamp(this.x, layout.arenaLeft + PLAYER_RADIUS, layout.arenaRight - PLAYER_RADIUS);
    this.y = Phaser.Math.Clamp(this.y, layout.arenaTop + PLAYER_RADIUS, layout.arenaBottom - PLAYER_RADIUS);

    this.graphic.setPosition(this.x, this.y);

    if (this.hasShield) {
      this.shieldPulse += delta * 0.005;
    }
    this.draw();
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();
    g.setAlpha(1);

    // Visual size is fixed regardless of hitbox radius
    const VISUAL_SIZE = 8;

    // Shield visual
    if (this.hasShield) {
      const shieldAlpha = 0.25 + Math.sin(this.shieldPulse) * 0.1;
      g.lineStyle(1.5, COLORS.SHIELD, shieldAlpha + 0.2);
      g.strokeCircle(0, 0, VISUAL_SIZE * 2.2);
    }

    const bodyColor = this.destroyed
      ? COLORS.HAZARD
      : (this.inverted ? 0xffffff : COLORS.PLAYER);

    // Glow
    g.lineStyle(1, bodyColor, 0.1);
    g.strokeCircle(0, 0, VISUAL_SIZE * 2.5);

    // Body - triangle oriented to heading (stroke-based hologram)
    const triR = VISUAL_SIZE * 1.3;
    const h = this.heading;
    // Nose points in heading direction, two rear vertices at +/-120 degrees
    const x1 = Math.cos(h) * triR;
    const y1 = Math.sin(h) * triR;
    const x2 = Math.cos(h + Math.PI * 2 / 3) * triR;
    const y2 = Math.sin(h + Math.PI * 2 / 3) * triR;
    const x3 = Math.cos(h - Math.PI * 2 / 3) * triR;
    const y3 = Math.sin(h - Math.PI * 2 / 3) * triR;

    g.lineStyle(1.5, bodyColor, 0.9);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.lineTo(x3, y3);
    g.closePath();
    g.strokePath();

    // Subtle inner fill for hologram volume
    g.fillStyle(bodyColor, 0.05);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.lineTo(x3, y3);
    g.closePath();
    g.fillPath();

    // Center dot — shows the actual hitbox point
    g.fillStyle(bodyColor, 0.6);
    g.fillCircle(0, 0, 1.5);
  }

  getVelocityX(): number { return this.vx; }
  getVelocityY(): number { return this.vy; }
  getHeading(): number { return this.heading; }

  destroy(): void {
    this.graphic.destroy();
  }

  setDestroyedVisual(destroyed: boolean): void {
    this.destroyed = destroyed;
    this.draw();
  }

  /** Reset position, velocity, shield, and destroyed visual. Used for campaign soft-respawn. */
  respawn(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hasShield = false;
    this.heading = -Math.PI / 2;
    this.shieldPulse = 0;
    this.destroyed = false;
    this.graphic.setAlpha(1);
    this.draw();
  }
}
