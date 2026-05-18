import Phaser from 'phaser';
import { RIVAL_FLEE_CHANCE, RIVAL_FLEE_SPEED, RIVAL_KITE_IDEAL_DISTANCE, RIVAL_KITE_MAX_DISTANCE, RIVAL_KITE_MIN_DISTANCE, RIVAL_LASER_ACTIVE_MS, RIVAL_LASER_AIM_ERROR_DEG, RIVAL_LASER_CHARGE_MS, RIVAL_LASER_COOLDOWN_MS, RIVAL_LASER_RANGE, RIVAL_LASER_STRAFE_SPEED, RIVAL_LASER_SWEEP_DEG_PER_SEC, RIVAL_LASER_TRACK_MS, RIVAL_LASER_TRIGGER_RANGE, RIVAL_LASER_WIDTH, RIVAL_RADIUS, RIVAL_SPEED, RIVAL_TURN_RATE } from '../data/tuning';
import type { RivalDef } from '../data/rivalData';
import { getLayout } from '../layout';
import { rotatePoint } from '../utils/geometry';
import { playSfx } from '../systems/SfxSystem';

type RivalState = 'enter' | 'hunt' | 'chargeLaser' | 'fireLaser' | 'recover' | 'flee' | 'escaped';

export interface RivalEvents {
  spawned: boolean;
  abilityTell: boolean;
  fleeing: boolean;
  escaped: boolean;
}

export class RivalShip {
  graphic: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  radius = RIVAL_RADIUS;
  active = true;

  private readonly scene: Phaser.Scene;
  private readonly def: RivalDef;
  private state: RivalState = 'enter';
  private heading = 0;
  private hp: number;
  private shieldLayers: number;
  private stateMs = 0;
  private laserCooldownMs = 1800;
  private laserStartX = 0;
  private laserStartY = 0;
  private laserEndX = 0;
  private laserEndY = 0;
  private laserAngle = 0;
  private laserAimOffset = 0;
  private events: RivalEvents = { spawned: true, abilityTell: false, fleeing: false, escaped: false };

  constructor(scene: Phaser.Scene, def: RivalDef) {
    this.scene = scene;
    this.def = def;
    this.hp = def.hp;
    this.shieldLayers = def.shieldLayers;

    const layout = getLayout();
    const margin = RIVAL_RADIUS + 30;
    const edge = Phaser.Math.Between(0, 3);
    switch (edge) {
      case 0:
        this.x = Phaser.Math.Between(layout.arenaLeft, layout.arenaRight);
        this.y = layout.arenaTop - margin;
        break;
      case 1:
        this.x = Phaser.Math.Between(layout.arenaLeft, layout.arenaRight);
        this.y = layout.arenaBottom + margin;
        break;
      case 2:
        this.x = layout.arenaLeft - margin;
        this.y = Phaser.Math.Between(layout.arenaTop, layout.arenaBottom);
        break;
      default:
        this.x = layout.arenaRight + margin;
        this.y = Phaser.Math.Between(layout.arenaTop, layout.arenaBottom);
        break;
    }

    this.heading = Math.atan2(layout.centerY - this.y, layout.centerX - this.x);
    this.vx = Math.cos(this.heading) * RIVAL_SPEED;
    this.vy = Math.sin(this.heading) * RIVAL_SPEED;
    this.graphic = scene.add.graphics().setDepth(6);
    this.graphic.setPosition(this.x, this.y);
    this.draw();
  }

  getDef(): RivalDef {
    return this.def;
  }

  getVelocityX(): number {
    return this.vx;
  }

  getVelocityY(): number {
    return this.vy;
  }

  consumeEvents(): RivalEvents {
    const events = { ...this.events };
    this.events = { spawned: false, abilityTell: false, fleeing: false, escaped: false };
    return events;
  }

  isFleeing(): boolean {
    return this.state === 'flee' || this.state === 'escaped';
  }

  takeHit(damage = 1): 'shield' | 'damaged' | 'fleeing' | 'destroyed' {
    if (this.isFleeing()) {
      this.active = false;
      return 'destroyed';
    }
    if (this.shieldLayers > 0) {
      this.shieldLayers--;
      return 'shield';
    }
    if (this.hp <= 1) {
      this.active = false;
      return 'destroyed';
    }
    if (this.hp - damage <= 1) {
      this.hp = 1;
      if (Math.random() < RIVAL_FLEE_CHANCE) {
        this.startFlee();
        return 'fleeing';
      }
      return 'damaged';
    }
    this.hp -= damage;
    return 'damaged';
  }

  update(delta: number, playerX: number, playerY: number): void {
    if (!this.active) return;
    this.stateMs += delta;

    if (this.state === 'chargeLaser') {
      if (this.stateMs <= RIVAL_LASER_TRACK_MS) {
        this.lockLaser(playerX, playerY, true);
      } else {
        this.updateLaserFromAngle();
      }
      this.strafeDuringLaser();
      if (this.stateMs >= RIVAL_LASER_CHARGE_MS) {
        this.state = 'fireLaser';
        this.stateMs = 0;
        playSfx(this.scene, 'beamFire', { volumeScale: 0.9, rate: 0.9, detune: -300 });
      }
    } else if (this.state === 'fireLaser') {
      this.sweepLaserToward(playerX, playerY, delta);
      this.updateLaserFromAngle();
      if (this.stateMs >= RIVAL_LASER_ACTIVE_MS) {
        this.state = 'recover';
        this.stateMs = 0;
      }
    } else if (this.state === 'recover') {
      this.steerToward(playerX, playerY, delta, RIVAL_SPEED * 0.7);
      if (this.stateMs >= 650) {
        this.state = 'hunt';
        this.stateMs = 0;
        this.laserCooldownMs = RIVAL_LASER_COOLDOWN_MS;
      }
    } else if (this.state === 'flee') {
      this.steerToward(this.getFleeTargetX(), this.getFleeTargetY(), delta, RIVAL_FLEE_SPEED);
    } else {
      if (this.state === 'enter' && this.isInsideArena(20)) {
        this.state = 'hunt';
        this.stateMs = 0;
      }
      if (this.state === 'hunt') {
        this.kitePlayer(playerX, playerY, delta);
        this.laserCooldownMs -= delta;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
        if (this.laserCooldownMs <= 0 && dist < RIVAL_LASER_TRIGGER_RANGE && dist > RIVAL_KITE_MIN_DISTANCE * 0.55) {
          this.state = 'chargeLaser';
          this.stateMs = 0;
          this.events.abilityTell = true;
          this.laserAimOffset = Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-RIVAL_LASER_AIM_ERROR_DEG, RIVAL_LASER_AIM_ERROR_DEG));
          this.lockLaser(playerX, playerY, true);
          playSfx(this.scene, 'beamCharge', { volumeScale: 0.55, rate: 1.18, detune: 700 });
        }
      } else {
        this.steerToward(playerX, playerY, delta, RIVAL_SPEED);
      }
    }

    const dt = delta / 1000;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.keepInsideArenaIfFighting();
    this.graphic.setPosition(this.x, this.y);
    this.draw();

    if (this.state === 'flee' && !this.isInsideArena(140)) {
      this.state = 'escaped';
      this.active = false;
      this.events.escaped = true;
    }
  }

  laserHits(x: number, y: number, radius: number): boolean {
    if (this.state !== 'fireLaser') return false;
    const dist = pointToSegmentDistance(x, y, this.laserStartX, this.laserStartY, this.laserEndX, this.laserEndY);
    return dist <= RIVAL_LASER_WIDTH / 2 + radius;
  }

  private startFlee(): void {
    if (this.isFleeing()) return;
    this.hp = 1;
    this.state = 'flee';
    this.stateMs = 0;
    this.events.fleeing = true;
    playSfx(this.scene, 'enemyEntrance', { volumeScale: 0.5, rate: 1.35 });
  }

  private steerToward(targetX: number, targetY: number, delta: number, speed: number): void {
    const dt = delta / 1000;
    const desired = Math.atan2(targetY - this.y, targetX - this.x);
    let angleDiff = desired - this.heading;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const maxTurn = RIVAL_TURN_RATE * dt;
    this.heading += Phaser.Math.Clamp(angleDiff, -maxTurn, maxTurn);
    const targetVx = Math.cos(this.heading) * speed;
    const targetVy = Math.sin(this.heading) * speed;
    this.vx += (targetVx - this.vx) * 0.12;
    this.vy += (targetVy - this.vy) * 0.12;
  }

  private kitePlayer(playerX: number, playerY: number, delta: number): void {
    const layout = getLayout();
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const awayX = dx / dist;
    const awayY = dy / dist;
    const tangentSign = Math.sin(this.stateMs * 0.0016) >= 0 ? 1 : -1;
    const tangentX = -awayY * tangentSign;
    const tangentY = awayX * tangentSign;

    let desiredX = this.x + tangentX * RIVAL_KITE_IDEAL_DISTANCE * 0.45;
    let desiredY = this.y + tangentY * RIVAL_KITE_IDEAL_DISTANCE * 0.45;
    if (dist < RIVAL_KITE_MIN_DISTANCE) {
      desiredX = this.x + awayX * RIVAL_KITE_IDEAL_DISTANCE;
      desiredY = this.y + awayY * RIVAL_KITE_IDEAL_DISTANCE;
    } else if (dist > RIVAL_KITE_MAX_DISTANCE) {
      desiredX = playerX + awayX * RIVAL_KITE_IDEAL_DISTANCE;
      desiredY = playerY + awayY * RIVAL_KITE_IDEAL_DISTANCE;
    }

    desiredX = Phaser.Math.Clamp(desiredX, layout.arenaLeft + 36, layout.arenaRight - 36);
    desiredY = Phaser.Math.Clamp(desiredY, layout.arenaTop + 36, layout.arenaBottom - 36);
    this.steerToward(desiredX, desiredY, delta, RIVAL_SPEED);
  }

  private lockLaser(playerX: number, playerY: number, includeAimError: boolean): void {
    this.laserAngle = Math.atan2(playerY - this.y, playerX - this.x) + (includeAimError ? this.laserAimOffset : 0);
    this.turnTowardAngle(this.laserAngle, 16);
    this.updateLaserFromAngle();
  }

  private updateLaserFromAngle(): void {
    const layout = getLayout();
    const screenSpan = Math.hypot(layout.gameWidth, layout.gameHeight) * 2.2;
    const range = Math.max(RIVAL_LASER_RANGE, screenSpan);
    this.laserStartX = this.x + Math.cos(this.laserAngle) * (this.radius + 4);
    this.laserStartY = this.y + Math.sin(this.laserAngle) * (this.radius + 4);
    this.laserEndX = this.laserStartX + Math.cos(this.laserAngle) * range;
    this.laserEndY = this.laserStartY + Math.sin(this.laserAngle) * range;
  }

  private strafeDuringLaser(): void {
    const side = Math.sin(this.stateMs * 0.006) >= 0 ? 1 : -1;
    const targetVx = Math.cos(this.laserAngle + Math.PI / 2) * RIVAL_LASER_STRAFE_SPEED * side;
    const targetVy = Math.sin(this.laserAngle + Math.PI / 2) * RIVAL_LASER_STRAFE_SPEED * side;
    this.vx += (targetVx - this.vx) * 0.08;
    this.vy += (targetVy - this.vy) * 0.08;
  }

  private sweepLaserToward(playerX: number, playerY: number, delta: number): void {
    const desired = Math.atan2(playerY - this.y, playerX - this.x);
    let diff = desired - this.laserAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const maxSweep = Phaser.Math.DegToRad(RIVAL_LASER_SWEEP_DEG_PER_SEC) * (delta / 1000);
    this.laserAngle += Phaser.Math.Clamp(diff, -maxSweep, maxSweep);
    this.turnTowardAngle(this.laserAngle, delta);
  }

  private turnTowardAngle(targetAngle: number, delta: number): void {
    let diff = targetAngle - this.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const maxTurn = RIVAL_TURN_RATE * (delta / 1000);
    this.heading += Phaser.Math.Clamp(diff, -maxTurn, maxTurn);
  }

  private getFleeTargetX(): number {
    const layout = getLayout();
    return this.x < layout.centerX ? layout.arenaLeft - 220 : layout.arenaRight + 220;
  }

  private getFleeTargetY(): number {
    const layout = getLayout();
    return this.y < layout.centerY ? layout.arenaTop - 220 : layout.arenaBottom + 220;
  }

  private isInsideArena(pad: number): boolean {
    const layout = getLayout();
    return (
      this.x >= layout.arenaLeft - pad &&
      this.x <= layout.arenaRight + pad &&
      this.y >= layout.arenaTop - pad &&
      this.y <= layout.arenaBottom + pad
    );
  }

  private keepInsideArenaIfFighting(): void {
    if (this.state === 'flee' || this.state === 'escaped') return;
    const layout = getLayout();
    const pad = this.radius + 10;
    const minX = layout.arenaLeft + pad;
    const maxX = layout.arenaRight - pad;
    const minY = layout.arenaTop + pad;
    const maxY = layout.arenaBottom - pad;
    const clampedX = Phaser.Math.Clamp(this.x, minX, maxX);
    const clampedY = Phaser.Math.Clamp(this.y, minY, maxY);
    if (clampedX !== this.x) {
      this.x = clampedX;
      this.vx *= -0.35;
    }
    if (clampedY !== this.y) {
      this.y = clampedY;
      this.vy *= -0.35;
    }
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();
    const color = this.def.color;
    const accent = this.def.accent;
    const r = this.radius;
    const fleeAlpha = this.state === 'flee' ? 0.55 + Math.sin(this.stateMs * 0.02) * 0.22 : 1;

    if (this.state === 'chargeLaser' || this.state === 'fireLaser') {
      const chargeProgress = this.state === 'chargeLaser'
        ? Phaser.Math.Clamp(this.stateMs / RIVAL_LASER_CHARGE_MS, 0, 1)
        : 1;
      const alpha = this.state === 'fireLaser' ? 0.86 : 0.22 + chargeProgress * 0.42;
      g.lineStyle(this.state === 'fireLaser' ? RIVAL_LASER_WIDTH * 1.7 : 3 + chargeProgress * 8, color, alpha * 0.22);
      g.lineBetween(this.laserStartX - this.x, this.laserStartY - this.y, this.laserEndX - this.x, this.laserEndY - this.y);
      g.lineStyle(this.state === 'fireLaser' ? RIVAL_LASER_WIDTH : 2, color, alpha);
      g.lineBetween(this.laserStartX - this.x, this.laserStartY - this.y, this.laserEndX - this.x, this.laserEndY - this.y);
      if (this.state === 'fireLaser') {
        g.lineStyle(3, 0xffffff, 0.68);
        g.lineBetween(this.laserStartX - this.x, this.laserStartY - this.y, this.laserEndX - this.x, this.laserEndY - this.y);
      }
    }

    g.lineStyle(1, color, 0.08 * fleeAlpha);
    g.strokeCircle(0, 0, r * 2.2);

    for (let i = 0; i < this.shieldLayers; i++) {
      g.lineStyle(1.1, 0xffffff, 0.62);
      g.strokeCircle(0, 0, r * (1.45 + i * 0.28) + Math.sin(this.stateMs * 0.006 + i) * 1.2);
    }

    const nose = rotatePoint(r * 1.95, 0, this.heading);
    const neckL = rotatePoint(r * 0.55, -r * 0.36, this.heading);
    const neckR = rotatePoint(r * 0.55, r * 0.36, this.heading);
    const wingTipL = rotatePoint(-r * 0.2, -r * 1.42, this.heading);
    const wingTipR = rotatePoint(-r * 0.2, r * 1.42, this.heading);
    const tailL = rotatePoint(-r * 1.18, -r * 0.62, this.heading);
    const tailR = rotatePoint(-r * 1.18, r * 0.62, this.heading);
    const tailNotch = rotatePoint(-r * 0.72, 0, this.heading);
    const damageRootL = rotatePoint(-r * 0.62, -r * 0.52, this.heading);
    const damageLevel = this.def.hp - this.hp;
    const leftWingMissing = this.hp <= 1;

    g.fillStyle(color, 0.16 * fleeAlpha);
    g.beginPath();
    g.moveTo(nose[0], nose[1]);
    g.lineTo(neckL[0], neckL[1]);
    if (leftWingMissing) {
      g.lineTo(damageRootL[0], damageRootL[1]);
    } else {
      g.lineTo(wingTipL[0], wingTipL[1]);
    }
    g.lineTo(tailL[0], tailL[1]);
    g.lineTo(tailNotch[0], tailNotch[1]);
    g.lineTo(tailR[0], tailR[1]);
    g.lineTo(wingTipR[0], wingTipR[1]);
    g.lineTo(neckR[0], neckR[1]);
    g.closePath();
    g.fillPath();

    g.lineStyle(1.9, color, 0.96 * fleeAlpha);
    g.strokePath();

    const spineA = rotatePoint(-r * 0.75, 0, this.heading);
    const spineB = rotatePoint(r * 1.25, 0, this.heading);
    const cockpit = rotatePoint(r * 0.44, 0, this.heading);
    const finL0 = rotatePoint(-r * 0.78, -r * 0.36, this.heading);
    const finL1 = rotatePoint(-r * 1.42, -r * 1.0, this.heading);
    const finR0 = rotatePoint(-r * 0.78, r * 0.36, this.heading);
    const finR1 = rotatePoint(-r * 1.42, r * 1.0, this.heading);
    g.lineStyle(1.2, accent, 0.82 * fleeAlpha);
    g.lineBetween(spineA[0], spineA[1], spineB[0], spineB[1]);
    if (!leftWingMissing) {
      g.lineBetween(finL0[0], finL0[1], finL1[0], finL1[1]);
    }
    g.lineBetween(finR0[0], finR0[1], finR1[0], finR1[1]);
    g.fillStyle(accent, 0.28 * fleeAlpha);
    g.fillCircle(cockpit[0], cockpit[1], r * 0.23);
    g.lineStyle(1, 0xffffff, 0.5 * fleeAlpha);
    g.strokeCircle(cockpit[0], cockpit[1], r * 0.24);

    if (damageLevel >= 1) {
      const crackA = rotatePoint(r * 0.08, -r * 0.32, this.heading);
      const crackB = rotatePoint(-r * 0.35, -r * 0.72, this.heading);
      const crackC = rotatePoint(-r * 0.08, -r * 0.86, this.heading);
      g.lineStyle(1.2, 0xffffff, 0.58 * fleeAlpha);
      g.lineBetween(crackA[0], crackA[1], crackB[0], crackB[1]);
      g.lineBetween(crackB[0], crackB[1], crackC[0], crackC[1]);
    }

    if (leftWingMissing) {
      const brokenA = rotatePoint(-r * 0.48, -r * 0.42, this.heading);
      const brokenB = rotatePoint(-r * 1.08, -r * 0.95, this.heading);
      const brokenC = rotatePoint(-r * 0.84, -r * 0.24, this.heading);
      g.lineStyle(1.4, accent, 0.86 * fleeAlpha);
      g.lineBetween(brokenA[0], brokenA[1], brokenB[0], brokenB[1]);
      g.lineBetween(brokenA[0], brokenA[1], brokenC[0], brokenC[1]);

      const smokeBase = rotatePoint(-r * 0.74, -r * 0.72, this.heading);
      for (let i = 0; i < 4; i++) {
        const drift = (this.stateMs * 0.002 + i * 0.65) % 1;
        const sx = smokeBase[0] - Math.cos(this.heading) * drift * r * 0.9 + Math.sin(this.heading) * (i - 1.5) * 1.8;
        const sy = smokeBase[1] - Math.sin(this.heading) * drift * r * 0.9 - Math.cos(this.heading) * (i - 1.5) * 1.8;
        g.fillStyle(0xffffff, (0.16 - drift * 0.1) * fleeAlpha);
        g.fillCircle(sx, sy, r * (0.18 + drift * 0.18));
      }
    }

    const barrelA = rotatePoint(r * 1.05, 0, this.heading);
    const barrelB = rotatePoint(r * 2.16, 0, this.heading);
    const barrelL = rotatePoint(r * 1.58, -r * 0.16, this.heading);
    const barrelR = rotatePoint(r * 1.58, r * 0.16, this.heading);
    g.fillStyle(accent, 0.3 * fleeAlpha);
    g.beginPath();
    g.moveTo(barrelB[0], barrelB[1]);
    g.lineTo(barrelL[0], barrelL[1]);
    g.lineTo(barrelA[0], barrelA[1]);
    g.lineTo(barrelR[0], barrelR[1]);
    g.closePath();
    g.fillPath();
    g.lineStyle(1.4, accent, 0.95 * fleeAlpha);
    g.strokePath();
    g.fillStyle(0xffffff, 0.75 * fleeAlpha);
    g.fillCircle(barrelB[0], barrelB[1], 2.2);

    const hpPips = Math.max(1, this.hp);
    for (let i = 0; i < hpPips; i++) {
      g.fillStyle(i === 0 && this.state === 'flee' ? 0xffffff : color, 0.75 * fleeAlpha);
      g.fillCircle(-r + i * 5, r + 7, 1.5);
    }
  }

  destroy(): void {
    this.graphic.destroy();
  }
}

function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const wx = px - x1;
  const wy = py - y1;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Phaser.Math.Distance.Between(px, py, x1, y1);
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Phaser.Math.Distance.Between(px, py, x2, y2);
  const t = c1 / c2;
  return Phaser.Math.Distance.Between(px, py, x1 + vx * t, y1 + vy * t);
}
