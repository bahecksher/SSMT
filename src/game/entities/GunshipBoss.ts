import Phaser from 'phaser';
import { COLORS } from '../constants';
import {
  GUNSHIP_BOSS_BEAM_ACTIVE_DURATION,
  GUNSHIP_BOSS_BEAM_COOLDOWN_DURATION,
  GUNSHIP_BOSS_BEAM_STAGGER_MS,
  GUNSHIP_BOSS_BEAM_WARNING_DURATION,
  GUNSHIP_BOSS_BEAM_WIDTH,
  GUNSHIP_BOSS_BODY_HALF_LENGTH,
  GUNSHIP_BOSS_BODY_THICKNESS,
  GUNSHIP_BOSS_CORE_INNER_RADIUS,
  GUNSHIP_BOSS_CORE_OUTER_RADIUS,
  GUNSHIP_BOSS_EDGE_PASS_MAX_MS,
  GUNSHIP_BOSS_EDGE_PASS_MIN_MS,
  GUNSHIP_BOSS_GUN_COUNT,
  GUNSHIP_BOSS_GUN_RADIUS,
  GUNSHIP_BOSS_HULL_OFFSET,
} from '../data/tuning';
import { getLayout } from '../layout';

type BossEdge = 'top' | 'bottom' | 'left' | 'right';
type BossBeamState = 'cooldown' | 'warning' | 'active';

interface GunMountState {
  offset: number;
  alive: boolean;
  beamOffsetMs: number;
}

interface LocalPoint {
  x: number;
  y: number;
}

export interface GunshipDropData {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const EDGE_OPTIONS: BossEdge[] = ['top', 'bottom', 'left', 'right'];
const PASS_OVERSCAN = GUNSHIP_BOSS_BODY_HALF_LENGTH + GUNSHIP_BOSS_BODY_THICKNESS + 64;

export class GunshipBoss {
  graphic: Phaser.GameObjects.Graphics;
  active = true;

  private edge: BossEdge = 'top';
  private x = 0;
  private y = 0;
  private passElapsed = 0;
  private passDurationMs = GUNSHIP_BOSS_EDGE_PASS_MIN_MS;
  private passStart = 0;
  private passEnd = 0;
  private beamPulse = 0;
  private beamCycleElapsed = 0;
  private beamWarningPulsePending = false;
  private beamWarningClusterActive = false;
  private corePulse = 0;
  private coreEntryPrimed = false;
  private guns: GunMountState[] = [];

  constructor(scene: Phaser.Scene, gunCount = GUNSHIP_BOSS_GUN_COUNT) {
    this.graphic = scene.add.graphics().setDepth(6);

    const usableSpan = GUNSHIP_BOSS_BODY_HALF_LENGTH * 1.52;
    const offsetStart = gunCount === 1 ? 0 : -usableSpan / 2;
    const offsetStep = gunCount <= 1 ? 0 : usableSpan / (gunCount - 1);
    for (let i = 0; i < gunCount; i++) {
      this.guns.push({
        offset: offsetStart + offsetStep * i,
        alive: true,
        beamOffsetMs: i * GUNSHIP_BOSS_BEAM_STAGGER_MS,
      });
    }

    this.chooseNewEdge(null);
    this.draw();
  }

  update(delta: number): void {
    if (!this.active) return;

    this.passElapsed += delta;
    this.beamPulse += delta * 0.006;
    this.beamCycleElapsed = (this.beamCycleElapsed + delta) % this.getBeamCycleDuration();
    this.corePulse += delta * 0.0045;

    const hasWarning = !this.isCoreExposed() && this.getWarningGunCount() > 0;
    if (!this.beamWarningClusterActive && hasWarning) {
      this.beamWarningPulsePending = true;
    }
    this.beamWarningClusterActive = hasWarning;

    if (this.passElapsed >= this.passDurationMs) {
      this.chooseNewEdge(this.edge);
    } else {
      this.updatePosition();
    }

    this.draw();
  }

  getAliveGunCount(): number {
    return this.guns.filter((gun) => gun.alive).length;
  }

  isCoreExposed(): boolean {
    return this.active && this.getAliveGunCount() === 0;
  }

  getStatusLabel(): string {
    if (this.isCoreExposed()) {
      return this.coreEntryPrimed ? 'GUNSHIP // CORE BREACH' : 'GUNSHIP // CORE EXPOSED';
    }

    const aliveGunCount = this.getAliveGunCount();
    const activeGunCount = this.getActiveGunCount();
    const warningGunCount = this.getWarningGunCount();

    if (activeGunCount > 0) {
      return `GUNSHIP // FIRING ${activeGunCount} // GUNS ${aliveGunCount}`;
    }

    if (warningGunCount > 0) {
      return `GUNSHIP // WARNING ${warningGunCount} // GUNS ${aliveGunCount}`;
    }

    return `GUNSHIP // SAFE WINDOW // GUNS ${aliveGunCount}`;
  }

  getStatusColor(): number {
    if (this.isCoreExposed()) {
      return COLORS.GATE;
    }

    if (this.getActiveGunCount() > 0 || this.getWarningGunCount() > 0) {
      return COLORS.ENEMY;
    }

    return COLORS.HUD;
  }

  getCollidingGunIndex(playerX: number, playerY: number, playerRadius: number): number | null {
    if (!this.active || this.isCoreExposed()) {
      return null;
    }

    for (let i = 0; i < this.guns.length; i++) {
      if (!this.guns[i].alive) continue;
      const gunPos = this.getGunPosition(i);
      const dist = Phaser.Math.Distance.Between(playerX, playerY, gunPos.x, gunPos.y);
      if (dist <= GUNSHIP_BOSS_GUN_RADIUS + playerRadius + 2) {
        return i;
      }
    }

    return null;
  }

  consumeBeamWarningPulse(): boolean {
    const pending = this.beamWarningPulsePending;
    this.beamWarningPulsePending = false;
    return pending;
  }

  destroyGun(index: number): GunshipDropData | null {
    if (!this.active || !this.guns[index]?.alive) {
      return null;
    }

    this.guns[index].alive = false;
    this.coreEntryPrimed = false;
    const gunPos = this.getGunPosition(index);
    const velocity = this.getTravelVelocity();
    return {
      x: gunPos.x,
      y: gunPos.y,
      vx: velocity.x * 0.25,
      vy: velocity.y * 0.25,
    };
  }

  checkBeamHit(targetX: number, targetY: number, targetRadius: number): boolean {
    if (!this.active || this.isCoreExposed()) {
      return false;
    }

    for (let i = 0; i < this.guns.length; i++) {
      if (!this.guns[i].alive || this.getGunBeamState(i) !== 'active') continue;
      const gunPos = this.getGunPosition(i);
      if (this.beamIntersectsCircle(gunPos.x, gunPos.y, targetX, targetY, targetRadius)) {
        return true;
      }
    }

    return false;
  }

  checkCoreContact(targetX: number, targetY: number, targetRadius: number): boolean {
    if (!this.isCoreExposed()) {
      return false;
    }

    const coreCenter = this.getCoreCenter();
    return Phaser.Math.Distance.Between(targetX, targetY, coreCenter.x, coreCenter.y) <= GUNSHIP_BOSS_CORE_OUTER_RADIUS + targetRadius;
  }

  updateCoreBreach(playerX: number, playerY: number, playerRadius: number, hasShield: boolean): boolean {
    if (!this.isCoreExposed()) {
      return false;
    }

    const coreCenter = this.getCoreCenter();
    const dist = Phaser.Math.Distance.Between(playerX, playerY, coreCenter.x, coreCenter.y);
    const enteredCore = dist <= GUNSHIP_BOSS_CORE_INNER_RADIUS + playerRadius + 4;

    if (!hasShield) {
      this.coreEntryPrimed = false;
      return false;
    }

    if (enteredCore) {
      this.coreEntryPrimed = true;
      return false;
    }

    if (this.coreEntryPrimed && dist >= GUNSHIP_BOSS_CORE_OUTER_RADIUS + playerRadius + 6) {
      this.active = false;
      this.coreEntryPrimed = false;
      return true;
    }

    return false;
  }

  getCenter(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  getEdge(): BossEdge {
    return this.edge;
  }

  destroy(): void {
    this.graphic.destroy();
  }

  private chooseNewEdge(previousEdge: BossEdge | null): void {
    const edgeChoices = previousEdge
      ? EDGE_OPTIONS.filter((edge) => edge !== previousEdge)
      : EDGE_OPTIONS;
    this.edge = Phaser.Utils.Array.GetRandom(edgeChoices);
    this.passDurationMs = Phaser.Math.Between(GUNSHIP_BOSS_EDGE_PASS_MIN_MS, GUNSHIP_BOSS_EDGE_PASS_MAX_MS);
    this.passElapsed = 0;
    this.beamCycleElapsed = 0;
    this.beamWarningPulsePending = false;
    this.beamWarningClusterActive = false;
    this.coreEntryPrimed = false;

    const layout = getLayout();
    const forward = Math.random() < 0.5;
    if (this.edge === 'top' || this.edge === 'bottom') {
      this.passStart = forward ? layout.arenaLeft - PASS_OVERSCAN : layout.arenaRight + PASS_OVERSCAN;
      this.passEnd = forward ? layout.arenaRight + PASS_OVERSCAN : layout.arenaLeft - PASS_OVERSCAN;
    } else {
      this.passStart = forward ? layout.arenaTop - PASS_OVERSCAN : layout.arenaBottom + PASS_OVERSCAN;
      this.passEnd = forward ? layout.arenaBottom + PASS_OVERSCAN : layout.arenaTop - PASS_OVERSCAN;
    }

    this.updatePosition();
  }

  private updatePosition(): void {
    const layout = getLayout();
    const progress = Phaser.Math.Clamp(this.passElapsed / this.passDurationMs, 0, 1);
    const slideCoord = Phaser.Math.Linear(this.passStart, this.passEnd, progress);

    switch (this.edge) {
      case 'top':
        this.x = slideCoord;
        this.y = layout.arenaTop + GUNSHIP_BOSS_HULL_OFFSET;
        break;
      case 'bottom':
        this.x = slideCoord;
        this.y = layout.arenaBottom - GUNSHIP_BOSS_HULL_OFFSET;
        break;
      case 'left':
        this.x = layout.arenaLeft + GUNSHIP_BOSS_HULL_OFFSET;
        this.y = slideCoord;
        break;
      case 'right':
        this.x = layout.arenaRight - GUNSHIP_BOSS_HULL_OFFSET;
        this.y = slideCoord;
        break;
    }
  }

  private getTravelVelocity(): { x: number; y: number } {
    const pixelsPerSecond = (this.passEnd - this.passStart) / (this.passDurationMs / 1000);
    if (this.edge === 'top' || this.edge === 'bottom') {
      return { x: pixelsPerSecond, y: 0 };
    }

    return { x: 0, y: pixelsPerSecond };
  }

  private getOrientationVectors(): { tangent: LocalPoint; inward: LocalPoint } {
    switch (this.edge) {
      case 'top':
        return { tangent: { x: 1, y: 0 }, inward: { x: 0, y: 1 } };
      case 'bottom':
        return { tangent: { x: 1, y: 0 }, inward: { x: 0, y: -1 } };
      case 'left':
        return { tangent: { x: 0, y: 1 }, inward: { x: 1, y: 0 } };
      case 'right':
        return { tangent: { x: 0, y: 1 }, inward: { x: -1, y: 0 } };
    }
  }

  private toWorldPoint(localX: number, localY: number): LocalPoint {
    const { tangent, inward } = this.getOrientationVectors();
    return {
      x: this.x + tangent.x * localX + inward.x * localY,
      y: this.y + tangent.y * localX + inward.y * localY,
    };
  }

  private getGunPosition(index: number): { x: number; y: number } {
    const offset = this.guns[index]?.offset ?? 0;
    return this.toWorldPoint(offset, GUNSHIP_BOSS_BODY_THICKNESS * 0.34);
  }

  private getCoreCenter(): { x: number; y: number } {
    return this.toWorldPoint(0, GUNSHIP_BOSS_BODY_THICKNESS * 0.08);
  }

  private beamIntersectsCircle(
    gunX: number,
    gunY: number,
    targetX: number,
    targetY: number,
    targetRadius: number,
  ): boolean {
    const layout = getLayout();
    const killDist = GUNSHIP_BOSS_BEAM_WIDTH / 2 + targetRadius;

    switch (this.edge) {
      case 'top':
        return targetY >= gunY && targetY <= layout.arenaBottom && Math.abs(targetX - gunX) < killDist;
      case 'bottom':
        return targetY <= gunY && targetY >= layout.arenaTop && Math.abs(targetX - gunX) < killDist;
      case 'left':
        return targetX >= gunX && targetX <= layout.arenaRight && Math.abs(targetY - gunY) < killDist;
      case 'right':
        return targetX <= gunX && targetX >= layout.arenaLeft && Math.abs(targetY - gunY) < killDist;
    }
  }

  private getBeamCycleDuration(): number {
    return GUNSHIP_BOSS_BEAM_COOLDOWN_DURATION + GUNSHIP_BOSS_BEAM_WARNING_DURATION + GUNSHIP_BOSS_BEAM_ACTIVE_DURATION;
  }

  private getGunBeamElapsed(index: number): number {
    const cycleDuration = this.getBeamCycleDuration();
    return (this.beamCycleElapsed + (this.guns[index]?.beamOffsetMs ?? 0)) % cycleDuration;
  }

  private getBeamStateForElapsed(elapsed: number): BossBeamState {
    if (elapsed < GUNSHIP_BOSS_BEAM_COOLDOWN_DURATION) {
      return 'cooldown';
    }

    if (elapsed < GUNSHIP_BOSS_BEAM_COOLDOWN_DURATION + GUNSHIP_BOSS_BEAM_WARNING_DURATION) {
      return 'warning';
    }

    return 'active';
  }

  private getGunBeamState(index: number): BossBeamState {
    if (this.isCoreExposed() || !this.guns[index]?.alive) {
      return 'cooldown';
    }

    return this.getBeamStateForElapsed(this.getGunBeamElapsed(index));
  }

  private getBeamStateProgressForElapsed(elapsed: number, state: BossBeamState): number {
    if (state === 'cooldown') {
      return Phaser.Math.Clamp(elapsed / GUNSHIP_BOSS_BEAM_COOLDOWN_DURATION, 0, 1);
    }

    const warningStart = GUNSHIP_BOSS_BEAM_COOLDOWN_DURATION;
    if (state === 'warning') {
      return Phaser.Math.Clamp((elapsed - warningStart) / GUNSHIP_BOSS_BEAM_WARNING_DURATION, 0, 1);
    }

    const activeStart = warningStart + GUNSHIP_BOSS_BEAM_WARNING_DURATION;
    return Phaser.Math.Clamp((elapsed - activeStart) / GUNSHIP_BOSS_BEAM_ACTIVE_DURATION, 0, 1);
  }

  private getGunBeamStateProgress(index: number, state: BossBeamState): number {
    return this.getBeamStateProgressForElapsed(this.getGunBeamElapsed(index), state);
  }

  private getWarningGunCount(): number {
    let count = 0;
    for (let i = 0; i < this.guns.length; i++) {
      if (this.guns[i].alive && this.getGunBeamState(i) === 'warning') {
        count++;
      }
    }
    return count;
  }

  private getActiveGunCount(): number {
    let count = 0;
    for (let i = 0; i < this.guns.length; i++) {
      if (this.guns[i].alive && this.getGunBeamState(i) === 'active') {
        count++;
      }
    }
    return count;
  }

  private getBeamEndpoint(
    gunX: number,
    gunY: number,
    layout: ReturnType<typeof getLayout>,
  ): { x: number; y: number } {
    switch (this.edge) {
      case 'top':
        return { x: gunX, y: layout.arenaBottom };
      case 'bottom':
        return { x: gunX, y: layout.arenaTop };
      case 'left':
        return { x: layout.arenaRight, y: gunY };
      case 'right':
        return { x: layout.arenaLeft, y: gunY };
    }
  }

  private getHullPoints(halfLength: number, halfThickness: number): LocalPoint[] {
    return [
      { x: -halfLength * 1.02, y: -halfThickness * 0.34 },
      { x: -halfLength * 0.88, y: -halfThickness * 1.02 },
      { x: -halfLength * 0.4, y: -halfThickness * 0.9 },
      { x: -halfLength * 0.15, y: -halfThickness * 1.22 },
      { x: halfLength * 0.15, y: -halfThickness * 1.22 },
      { x: halfLength * 0.4, y: -halfThickness * 0.9 },
      { x: halfLength * 0.88, y: -halfThickness * 1.02 },
      { x: halfLength * 1.02, y: -halfThickness * 0.34 },
      { x: halfLength * 1.14, y: halfThickness * 0.08 },
      { x: halfLength * 0.9, y: halfThickness * 0.54 },
      { x: halfLength * 0.42, y: halfThickness * 0.88 },
      { x: halfLength * 0.16, y: halfThickness * 1.2 },
      { x: 0, y: halfThickness * 1.84 },
      { x: -halfLength * 0.16, y: halfThickness * 1.2 },
      { x: -halfLength * 0.42, y: halfThickness * 0.88 },
      { x: -halfLength * 0.9, y: halfThickness * 0.54 },
      { x: -halfLength * 1.14, y: halfThickness * 0.08 },
    ];
  }

  private getInnerHullPoints(halfLength: number, halfThickness: number): LocalPoint[] {
    return [
      { x: -halfLength * 0.9, y: -halfThickness * 0.16 },
      { x: -halfLength * 0.68, y: -halfThickness * 0.74 },
      { x: -halfLength * 0.22, y: -halfThickness * 0.58 },
      { x: halfLength * 0.22, y: -halfThickness * 0.58 },
      { x: halfLength * 0.68, y: -halfThickness * 0.74 },
      { x: halfLength * 0.9, y: -halfThickness * 0.16 },
      { x: halfLength * 0.72, y: halfThickness * 0.32 },
      { x: halfLength * 0.28, y: halfThickness * 0.6 },
      { x: 0, y: halfThickness * 1.16 },
      { x: -halfLength * 0.28, y: halfThickness * 0.6 },
      { x: -halfLength * 0.72, y: halfThickness * 0.32 },
    ];
  }

  private getBridgePoints(halfLength: number, halfThickness: number): LocalPoint[] {
    return [
      { x: -halfLength * 0.2, y: -halfThickness * 0.56 },
      { x: halfLength * 0.2, y: -halfThickness * 0.56 },
      { x: halfLength * 0.28, y: -halfThickness * 0.12 },
      { x: 0, y: halfThickness * 0.34 },
      { x: -halfLength * 0.28, y: -halfThickness * 0.12 },
    ];
  }

  private getFinPoints(side: -1 | 1, halfLength: number, halfThickness: number): LocalPoint[] {
    return [
      { x: side * halfLength * 0.66, y: -halfThickness * 0.12 },
      { x: side * halfLength * 1.22, y: halfThickness * 0.08 },
      { x: side * halfLength * 0.72, y: halfThickness * 0.72 },
    ];
  }

  private drawLocalPolygon(
    g: Phaser.GameObjects.Graphics,
    localPoints: LocalPoint[],
    fillColor: number,
    fillAlpha: number,
    strokeColor: number,
    strokeAlpha: number,
    lineWidth: number,
  ): void {
    const worldPoints = localPoints.map((point) => this.toWorldPoint(point.x, point.y));
    g.lineStyle(lineWidth, strokeColor, strokeAlpha);
    if (fillAlpha > 0) {
      g.fillStyle(fillColor, fillAlpha);
    }
    g.beginPath();
    g.moveTo(worldPoints[0].x, worldPoints[0].y);
    for (let i = 1; i < worldPoints.length; i++) {
      g.lineTo(worldPoints[i].x, worldPoints[i].y);
    }
    g.closePath();
    if (fillAlpha > 0) {
      g.fillPath();
    }
    g.strokePath();
  }

  private drawLocalLine(
    g: Phaser.GameObjects.Graphics,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number,
    color: number,
    alpha: number,
  ): void {
    const from = this.toWorldPoint(fromX, fromY);
    const to = this.toWorldPoint(toX, toY);
    g.lineStyle(width, color, alpha);
    g.lineBetween(from.x, from.y, to.x, to.y);
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();
    if (!this.active) {
      return;
    }

    const hullColor = COLORS.ENEMY;
    const halfLength = GUNSHIP_BOSS_BODY_HALF_LENGTH;
    const halfThickness = GUNSHIP_BOSS_BODY_THICKNESS / 2;
    const hullPoints = this.getHullPoints(halfLength, halfThickness);
    const innerHullPoints = this.getInnerHullPoints(halfLength, halfThickness);
    const bridgePoints = this.getBridgePoints(halfLength, halfThickness);

    this.drawLocalPolygon(g, hullPoints, hullColor, 0.08, hullColor, 0.3, 1.15);
    this.drawLocalPolygon(g, innerHullPoints, COLORS.BG, 0.9, hullColor, 0.96, 1.6);
    this.drawLocalPolygon(g, innerHullPoints, hullColor, 0.1, hullColor, 0.16, 0.8);
    this.drawLocalPolygon(g, this.getFinPoints(-1, halfLength, halfThickness), hullColor, 0.1, hullColor, 0.56, 1.2);
    this.drawLocalPolygon(g, this.getFinPoints(1, halfLength, halfThickness), hullColor, 0.1, hullColor, 0.56, 1.2);
    this.drawLocalPolygon(
      g,
      bridgePoints,
      this.isCoreExposed() ? COLORS.GATE : COLORS.BG,
      this.isCoreExposed() ? 0.12 : 0.92,
      this.isCoreExposed() ? COLORS.GATE : hullColor,
      this.isCoreExposed() ? 0.62 : 0.42,
      1.1,
    );

    this.drawLocalLine(g, -halfLength * 0.7, -halfThickness * 0.16, 0, halfThickness * 1.28, 1.1, hullColor, 0.26);
    this.drawLocalLine(g, halfLength * 0.7, -halfThickness * 0.16, 0, halfThickness * 1.28, 1.1, hullColor, 0.26);
    this.drawLocalLine(g, 0, -halfThickness * 0.62, 0, halfThickness * 1.42, 1.15, hullColor, 0.34);

    for (let i = 0; i < this.guns.length; i++) {
      const gunPos = this.getGunPosition(i);
      const beamState = this.getGunBeamState(i);
      if (this.guns[i].alive) {
        this.drawBeam(g, i, gunPos.x, gunPos.y, getLayout());
        g.fillStyle(COLORS.BG, 0.94);
        g.lineStyle(1.55, hullColor, 0.98);
        g.fillCircle(gunPos.x, gunPos.y, GUNSHIP_BOSS_GUN_RADIUS);
        g.strokeCircle(gunPos.x, gunPos.y, GUNSHIP_BOSS_GUN_RADIUS);
        g.lineStyle(1.3, hullColor, beamState === 'cooldown' ? 0.28 : 0.8);
        g.strokeCircle(gunPos.x, gunPos.y, GUNSHIP_BOSS_GUN_RADIUS * 0.68);

        if (beamState === 'warning') {
          const chargeRadius = GUNSHIP_BOSS_GUN_RADIUS * (0.96 + this.getGunBeamStateProgress(i, 'warning') * 0.34);
          g.lineStyle(1.05, hullColor, 0.4 + Math.sin(this.beamPulse + i * 0.8) * 0.12);
          g.strokeCircle(gunPos.x, gunPos.y, chargeRadius);
        } else if (beamState === 'active') {
          g.lineStyle(1.15, 0xffffff, 0.64);
          g.strokeCircle(gunPos.x, gunPos.y, GUNSHIP_BOSS_GUN_RADIUS * 0.42);
        }
      } else {
        g.lineStyle(1.15, hullColor, 0.32);
        g.strokeCircle(gunPos.x, gunPos.y, GUNSHIP_BOSS_GUN_RADIUS * 0.8);
      }
    }

    if (this.isCoreExposed()) {
      const pulse = 0.14 + Math.sin(this.corePulse) * 0.06;
      const coreCenter = this.getCoreCenter();
      g.fillStyle(COLORS.GATE, 0.1 + pulse);
      g.fillCircle(coreCenter.x, coreCenter.y, GUNSHIP_BOSS_CORE_OUTER_RADIUS);
      g.lineStyle(2.1, COLORS.GATE, this.coreEntryPrimed ? 1 : 0.88);
      g.strokeCircle(coreCenter.x, coreCenter.y, GUNSHIP_BOSS_CORE_OUTER_RADIUS);
      g.lineStyle(1.25, 0xffffff, 0.56);
      g.strokeCircle(coreCenter.x, coreCenter.y, GUNSHIP_BOSS_CORE_INNER_RADIUS);
      g.fillStyle(COLORS.BG, 0.94);
      g.fillCircle(coreCenter.x, coreCenter.y, GUNSHIP_BOSS_CORE_INNER_RADIUS - 3);
    }
  }

  private drawBeam(
    g: Phaser.GameObjects.Graphics,
    index: number,
    gunX: number,
    gunY: number,
    layout: ReturnType<typeof getLayout>,
  ): void {
    const beamState = this.getGunBeamState(index);
    if (beamState === 'cooldown') {
      return;
    }

    const endpoint = this.getBeamEndpoint(gunX, gunY, layout);
    const x2 = endpoint.x;
    const y2 = endpoint.y;
    const beamColor = COLORS.ENEMY;

    if (beamState === 'warning') {
      const warningProgress = this.getGunBeamStateProgress(index, 'warning');
      const flicker = 0.44 + Math.sin(this.beamPulse + index * 0.75 + gunX * 0.01 + gunY * 0.01) * 0.18;
      const alpha = flicker * (0.42 + warningProgress * 0.34);
      const segmentCount = 10;
      for (let i = 0; i < segmentCount; i++) {
        const startT = i / segmentCount;
        const endT = Phaser.Math.Clamp(startT + 0.55 / segmentCount, 0, 1);
        g.lineStyle(2.2, beamColor, alpha * (0.88 - i * 0.035));
        g.lineBetween(
          Phaser.Math.Linear(gunX, x2, startT),
          Phaser.Math.Linear(gunY, y2, startT),
          Phaser.Math.Linear(gunX, x2, endT),
          Phaser.Math.Linear(gunY, y2, endT),
        );
      }

      const growWidth = GUNSHIP_BOSS_BEAM_WIDTH * (0.16 + warningProgress * 0.4);
      g.lineStyle(growWidth, beamColor, 0.08 + warningProgress * 0.1);
      g.lineBetween(gunX, gunY, x2, y2);
      return;
    }

    const activeProgress = this.getGunBeamStateProgress(index, 'active');
    const fadeAlpha = activeProgress > 0.72 ? 1 - (activeProgress - 0.72) / 0.28 : 1;
    const glowAlpha = (0.14 + Math.sin(this.beamPulse + index * 0.7 + gunX * 0.02 + gunY * 0.02) * 0.05) * fadeAlpha;
    g.lineStyle(GUNSHIP_BOSS_BEAM_WIDTH * 2.2, beamColor, glowAlpha);
    g.lineBetween(gunX, gunY, x2, y2);
    g.lineStyle(GUNSHIP_BOSS_BEAM_WIDTH, beamColor, 0.84 * fadeAlpha);
    g.lineBetween(gunX, gunY, x2, y2);
    g.lineStyle(Math.max(2, GUNSHIP_BOSS_BEAM_WIDTH * 0.24), 0xffffff, 0.58 * fadeAlpha);
    g.lineBetween(gunX, gunY, x2, y2);
  }
}
