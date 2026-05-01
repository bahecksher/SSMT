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

export interface BossForceImpulse {
  ax: number;
  ay: number;
  ix: number;
  iy: number;
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
  // Optional: gravity / repulse field. Returns acceleration (ax,ay; px/s^2 — caller scales by dt)
  // and one-shot impulse (ix,iy; px/s — applied directly on the frame consumed).
  getForceField?(targetX: number, targetY: number, delta: number): BossForceImpulse;
  // Optional: salvage point multiplier active at the given world position (>= 1).
  getSalvageMultiplier?(targetX: number, targetY: number): number;
}
