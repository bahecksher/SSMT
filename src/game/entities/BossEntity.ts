export interface BossDropData {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface BossDestructionPlan {
  center: { x: number; y: number };
  inward: { x: number; y: number };
  tangent: { x: number; y: number };
}

export interface BossVentDrop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  sizeScale: number;
  mineable: boolean;
}

export interface BossEntity {
  active: boolean;
  update(delta: number): void;
  consumeWarningPulse(): boolean;
  consumeAsteroidVents(): BossVentDrop[];
  checkBeamHit(targetX: number, targetY: number, targetRadius: number): boolean;
  getCollidingHardpointIndex(targetX: number, targetY: number, targetRadius: number): number | null;
  destroyHardpoint(index: number): BossDropData | null;
  isCoreExposed(): boolean;
  checkCoreContact(targetX: number, targetY: number, targetRadius: number): boolean;
  updateCoreBreach(targetX: number, targetY: number, targetRadius: number, hasShield: boolean): boolean;
  getCenter(): { x: number; y: number };
  getDestructionPlan(): BossDestructionPlan;
  getStatusLabel(): string;
  getStatusColor(): number;
  destroy(): void;
}
