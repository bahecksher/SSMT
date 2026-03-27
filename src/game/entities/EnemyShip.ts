import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { ENEMY_RADIUS, ENEMY_SPEED, ENEMY_TURN_RATE } from '../data/tuning';

const ENEMY_COLOR = 0xff00ff; // magenta

function rotatePoint(px: number, py: number, angle: number): [number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [px * cos - py * sin, px * sin + py * cos];
}

export class EnemyShip {
  graphic: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  radius = ENEMY_RADIUS;
  active = true;
  inverted = false;

  private vx: number;
  private vy: number;
  private heading: number; // current facing angle in radians

  constructor(scene: Phaser.Scene) {
    const margin = ENEMY_RADIUS + 20;

    // Spawn from a random edge
    const edge = Phaser.Math.Between(0, 3);
    let targetX: number;
    let targetY: number;

    switch (edge) {
      case 0: // top
        this.x = Phaser.Math.Between(0, GAME_WIDTH);
        this.y = -margin;
        targetX = GAME_WIDTH / 2;
        targetY = GAME_HEIGHT / 2;
        break;
      case 1: // bottom
        this.x = Phaser.Math.Between(0, GAME_WIDTH);
        this.y = GAME_HEIGHT + margin;
        targetX = GAME_WIDTH / 2;
        targetY = GAME_HEIGHT / 2;
        break;
      case 2: // left
        this.x = -margin;
        this.y = Phaser.Math.Between(0, GAME_HEIGHT);
        targetX = GAME_WIDTH / 2;
        targetY = GAME_HEIGHT / 2;
        break;
      default: // right
        this.x = GAME_WIDTH + margin;
        this.y = Phaser.Math.Between(0, GAME_HEIGHT);
        targetX = GAME_WIDTH / 2;
        targetY = GAME_HEIGHT / 2;
        break;
    }

    this.heading = Math.atan2(targetY - this.y, targetX - this.x);
    this.vx = Math.cos(this.heading) * ENEMY_SPEED;
    this.vy = Math.sin(this.heading) * ENEMY_SPEED;

    this.graphic = scene.add.graphics().setDepth(5);
    this.draw();
    this.graphic.setPosition(this.x, this.y);
  }

  update(delta: number, playerX: number, playerY: number): void {
    if (!this.active) return;

    const dt = delta / 1000;

    // Steer toward the player
    const desiredAngle = Math.atan2(playerY - this.y, playerX - this.x);
    let angleDiff = desiredAngle - this.heading;

    // Normalize to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Apply turn rate limit
    const maxTurn = ENEMY_TURN_RATE * dt;
    if (angleDiff > maxTurn) angleDiff = maxTurn;
    else if (angleDiff < -maxTurn) angleDiff = -maxTurn;

    this.heading += angleDiff;
    this.vx = Math.cos(this.heading) * ENEMY_SPEED;
    this.vy = Math.sin(this.heading) * ENEMY_SPEED;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.graphic.setPosition(this.x, this.y);
    this.draw();

    // Deactivate if way offscreen (overshot and left the arena area)
    const offMargin = 200;
    if (
      this.x < -offMargin ||
      this.x > GAME_WIDTH + offMargin ||
      this.y < -offMargin ||
      this.y > GAME_HEIGHT + offMargin
    ) {
      this.active = false;
    }
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();

    // Hologram flicker
    if (!this.inverted && Math.random() < 0.03) {
      g.setAlpha(0.4);
    } else {
      g.setAlpha(1);
    }

    const r = this.radius;
    const color = this.inverted ? 0x000000 : ENEMY_COLOR;

    // Glow ring
    g.lineStyle(1, color, 0.08);
    g.strokeCircle(0, 0, r * 2.5);

    // Arrow/wedge shape pointing in movement direction (stroke-based)
    const nose: [number, number] = [r * 1.4, 0];
    const wingR: [number, number] = [-r * 0.8, r * 1.0];
    const rear: [number, number] = [-r * 0.3, 0];
    const wingL: [number, number] = [-r * 0.8, -r * 1.0];

    const [nx, ny] = rotatePoint(nose[0], nose[1], this.heading);
    const [wrx, wry] = rotatePoint(wingR[0], wingR[1], this.heading);
    const [rx, ry] = rotatePoint(rear[0], rear[1], this.heading);
    const [wlx, wly] = rotatePoint(wingL[0], wingL[1], this.heading);

    g.lineStyle(1.5, color, 0.9);
    g.beginPath();
    g.moveTo(nx, ny);
    g.lineTo(wrx, wry);
    g.lineTo(rx, ry);
    g.lineTo(wlx, wly);
    g.closePath();
    g.strokePath();

    // Subtle hologram fill
    g.fillStyle(color, 0.05);
    g.beginPath();
    g.moveTo(nx, ny);
    g.lineTo(wrx, wry);
    g.lineTo(rx, ry);
    g.lineTo(wlx, wly);
    g.closePath();
    g.fillPath();

    // Engine glow at rear
    const [ex, ey] = rotatePoint(-r * 0.6, 0, this.heading);
    g.fillStyle(color, 0.4);
    g.fillCircle(ex, ey, r * 0.2);
  }

  /** Returns wedge shape vertices in world space. */
  getWorldVertices(): [number, number][] {
    const r = this.radius;
    const localVerts: [number, number][] = [
      [r * 1.4, 0],
      [-r * 0.8, r * 1.0],
      [-r * 0.3, 0],
      [-r * 0.8, -r * 1.0],
    ];
    return localVerts.map(([vx, vy]) => {
      const [rx, ry] = rotatePoint(vx, vy, this.heading);
      return [this.x + rx, this.y + ry] as [number, number];
    });
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
