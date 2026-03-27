import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT,
  ARENA_LEFT, ARENA_TOP, ARENA_RIGHT, ARENA_BOTTOM,
} from '../constants';
import { NPC_RADIUS, NPC_SPEED, NPC_TURN_RATE } from '../data/tuning';

const NPC_COLOR = 0xffcc44; // amber/yellow — friendly but distinct

function rotatePoint(px: number, py: number, angle: number): [number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [px * cos - py * sin, px * sin + py * cos];
}

export class NPCShip {
  graphic: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  radius = NPC_RADIUS;
  active = true;
  inverted = false;
  killedByHazard = false;
  hasShield = false;

  private heading: number;
  private targetX = 0;
  private targetY = 0;
  private hasTarget = false;
  private salvaging = false;
  private salvageTimer = 0;

  constructor(scene: Phaser.Scene) {
    const margin = NPC_RADIUS + 20;

    // Spawn from a random edge
    const edge = Phaser.Math.Between(0, 3);
    switch (edge) {
      case 0:
        this.x = Phaser.Math.Between(0, GAME_WIDTH);
        this.y = -margin;
        break;
      case 1:
        this.x = Phaser.Math.Between(0, GAME_WIDTH);
        this.y = GAME_HEIGHT + margin;
        break;
      case 2:
        this.x = -margin;
        this.y = Phaser.Math.Between(0, GAME_HEIGHT);
        break;
      default:
        this.x = GAME_WIDTH + margin;
        this.y = Phaser.Math.Between(0, GAME_HEIGHT);
        break;
    }

    // Initial heading toward center
    this.heading = Math.atan2(GAME_HEIGHT / 2 - this.y, GAME_WIDTH / 2 - this.x);
    this.vx = Math.cos(this.heading) * NPC_SPEED;
    this.vy = Math.sin(this.heading) * NPC_SPEED;

    this.graphic = scene.add.graphics().setDepth(5);
    this.draw();
    this.graphic.setPosition(this.x, this.y);
  }

  static createAt(scene: Phaser.Scene, x: number, y: number, vx: number, vy: number): NPCShip {
    const npc = Object.create(NPCShip.prototype) as NPCShip;
    npc.x = x;
    npc.y = y;
    npc.vx = vx;
    npc.vy = vy;
    npc.radius = NPC_RADIUS;
    npc.active = true;
    npc.inverted = false;
    npc.killedByHazard = false;
    npc.hasShield = false;
    npc.heading = Math.atan2(vy, vx);
    npc.targetX = 0;
    npc.targetY = 0;
    npc.hasTarget = false;
    npc.salvaging = false;
    npc.salvageTimer = 0;
    npc.graphic = scene.add.graphics().setDepth(5);
    npc.draw();
    npc.graphic.setPosition(npc.x, npc.y);
    return npc;
  }

  /** Set or clear the salvage target the NPC is heading toward. */
  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
    this.hasTarget = true;
  }

  clearTarget(): void {
    this.hasTarget = false;
    this.salvaging = false;
    this.salvageTimer = 0;
  }

  isSalvaging(): boolean {
    return this.salvaging;
  }

  getSalvageTimer(): number {
    return this.salvageTimer;
  }

  /** Apply an impulse (used for player bump). */
  applyImpulse(ix: number, iy: number): void {
    this.vx += ix;
    this.vy += iy;
    // Briefly lose target so it drifts before re-acquiring
    this.salvaging = false;
    this.salvageTimer = 0;
  }

  consumeShield(): boolean {
    if (!this.hasShield) return false;
    this.hasShield = false;
    return true;
  }

  update(delta: number): void {
    if (!this.active) return;

    const dt = delta / 1000;

    // Determine desired heading
    let desiredAngle: number;
    if (this.hasTarget) {
      desiredAngle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
    } else {
      // Drift toward arena center if no target
      const cx = (ARENA_LEFT + ARENA_RIGHT) / 2;
      const cy = (ARENA_TOP + ARENA_BOTTOM) / 2;
      desiredAngle = Math.atan2(cy - this.y, cx - this.x);
    }

    // Steer with turn rate limit
    let angleDiff = desiredAngle - this.heading;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const maxTurn = NPC_TURN_RATE * dt;
    if (angleDiff > maxTurn) angleDiff = maxTurn;
    else if (angleDiff < -maxTurn) angleDiff = -maxTurn;

    this.heading += angleDiff;

    // Gradually steer velocity toward heading
    const targetVx = Math.cos(this.heading) * NPC_SPEED;
    const targetVy = Math.sin(this.heading) * NPC_SPEED;
    this.vx += (targetVx - this.vx) * 0.08;
    this.vy += (targetVy - this.vy) * 0.08;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Check if in salvage range
    if (this.hasTarget) {
      const distToTarget = Math.sqrt(
        (this.targetX - this.x) ** 2 + (this.targetY - this.y) ** 2,
      );
      if (distToTarget < 80) {
        this.salvaging = true;
        this.salvageTimer += delta;
      } else {
        this.salvaging = false;
        this.salvageTimer = 0;
      }
    }

    this.graphic.setPosition(this.x, this.y);
    this.draw();

    // Deactivate if way offscreen
    const offMargin = 250;
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
    const color = this.inverted ? 0x000000 : NPC_COLOR;

    // Glow ring
    g.lineStyle(1, color, 0.06);
    g.strokeCircle(0, 0, r * 2.2);

    if (this.hasShield) {
      g.lineStyle(1.25, 0x44aaff, 0.75);
      g.strokeCircle(0, 0, r * 1.9 + Math.sin(this.salvageTimer * 0.004) * 1.5);
    }

    // Triangle ship shape (similar to player but slightly different proportions)
    const triR = r * 1.2;
    const h = this.heading;
    const x1 = Math.cos(h) * triR;
    const y1 = Math.sin(h) * triR;
    const x2 = Math.cos(h + Math.PI * 0.75) * triR;
    const y2 = Math.sin(h + Math.PI * 0.75) * triR;
    const x3 = Math.cos(h - Math.PI * 0.75) * triR;
    const y3 = Math.sin(h - Math.PI * 0.75) * triR;

    g.lineStyle(1.5, color, 0.8);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.lineTo(x3, y3);
    g.closePath();
    g.strokePath();

    // Subtle fill
    g.fillStyle(color, 0.05);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.lineTo(x3, y3);
    g.closePath();
    g.fillPath();

    // Engine glow at rear
    const [ex, ey] = rotatePoint(-r * 0.5, 0, this.heading);
    g.fillStyle(color, 0.35);
    g.fillCircle(ex, ey, r * 0.2);

    // Salvaging indicator — pulsing ring when actively salvaging
    if (this.salvaging) {
      const pulseAlpha = 0.2 + Math.sin(this.salvageTimer * 0.008) * 0.15;
      g.lineStyle(1, color, pulseAlpha);
      g.strokeCircle(0, 0, r * 3);
    }
  }

  /** Returns triangle vertices in world space for polygon collision. */
  getWorldVertices(): [number, number][] {
    const triR = this.radius * 1.2;
    const h = this.heading;
    return [
      [this.x + Math.cos(h) * triR, this.y + Math.sin(h) * triR],
      [this.x + Math.cos(h + Math.PI * 0.75) * triR, this.y + Math.sin(h + Math.PI * 0.75) * triR],
      [this.x + Math.cos(h - Math.PI * 0.75) * triR, this.y + Math.sin(h - Math.PI * 0.75) * triR],
    ];
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
