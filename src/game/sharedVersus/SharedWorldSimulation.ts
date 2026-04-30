import type {
  SharedClientMessage,
  SharedDrifterState,
  SharedGateState,
  SharedLaserLane,
  SharedLaserState,
  SharedPlayerState,
  SharedSalvageState,
  SharedServerMessage,
  SharedWorldConfig,
  SharedWorldSnapshot,
} from './types';

const SNAPSHOT_WORLD_SIZE = 1;
const CANONICAL_ARENA_SIZE = 615;
const PLAYER_RADIUS = 0.012;
const EXTRACT_HITBOX = 0.045;
const OFFSCREEN_MARGIN_N = 0.12;
const PHASE_LENGTH = 30_000;
const EXIT_GATE_PREVIEW = 15_000;
const EXIT_GATE_DURATION = 3_000;
const SALVAGE_RADIUS = 80;
const SALVAGE_POINTS_PER_SECOND = 10;
const SALVAGE_DRIFT_SPEED_MIN = 20;
const SALVAGE_DRIFT_SPEED_MAX = 50;
const SALVAGE_MAX_HP = 15;
const SALVAGE_RESPAWN_DELAY = 1500;
const DRIFTER_RADIUS = 16;
const DRIFTER_SPEED_BASE = 70;
const DRIFTER_SPEED_MAX = 200;
const DRIFTER_MAX_HP = 10;
const DRIFTER_MINEABLE_CHANCE = 0.35;
const DRIFTER_MINING_RADIUS_MULT = 2.8;
const DRIFTER_MINING_POINTS_MIN = 5;
const DRIFTER_MINING_POINTS_MAX = 30;
const HP_DEPLETED_WARN_TIME = 3000;
const VERSUS_LASER_WARNING_MS = 900;
const VERSUS_LASER_LETHAL_MS = 500;
const VERSUS_LASER_WIDTH = 26;
const NORMAL_SALVAGE_RADIUS_N = SALVAGE_RADIUS / CANONICAL_ARENA_SIZE;
const RARE_SALVAGE_RADIUS_N = NORMAL_SALVAGE_RADIUS_N * 0.65;
const DRIFTER_RADIUS_N = DRIFTER_RADIUS / CANONICAL_ARENA_SIZE;
const VERSUS_LASER_WIDTH_N = VERSUS_LASER_WIDTH / CANONICAL_ARENA_SIZE;

interface SimEventSink {
  send(message: SharedServerMessage): void;
}

interface SharedDrifterSimState extends SharedDrifterState {
  depletedTimerMs: number;
}

interface SharedSalvageSimState extends SharedSalvageState {
  depletedTimerMs: number;
  lifetimeMs: number;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function getSharedPhaseConfig(phase: number): {
  hazardSpawnRate: number;
  hazardSpeedMultiplier: number;
  maxConcurrentDrifters: number;
} {
  const rawDrifterCap = Math.floor(4 + phase * 3 + Math.pow(phase, 1.6));
  return {
    hazardSpawnRate: 600 * Math.pow(0.75, Math.min(phase - 1, 3)),
    hazardSpeedMultiplier: 1 + 0.18 * (phase - 1),
    maxConcurrentDrifters: phase >= 5 ? Math.min(rawDrifterCap, 22) : rawDrifterCap,
  };
}

export class SharedWorldSimulation {
  private readonly matchId: string;
  private readonly random: () => number;
  private readonly players = new Map<string, SharedPlayerState>();
  private readonly consumedShieldPlayers = new Set<string>();
  private drifters: SharedDrifterSimState[] = [];
  private salvage: SharedSalvageSimState[] = [];
  private lasers: SharedLaserState[] = [];
  private gate: SharedGateState | null = null;
  private phase = 1;
  private phaseTimerMs = 0;
  private drifterSpawnTimerMs = 0;
  private salvageRespawnTimerMs = 0;
  private rareSalvageTimerMs = 0;
  private elapsedMs = 0;
  private tickId = 0;
  private nextEntityId = 1;

  constructor(config: SharedWorldConfig) {
    this.matchId = config.matchId;
    this.random = mulberry32(config.seed ?? hashSeed(config.matchId));
    this.spawnSalvage(false);
    this.seedInitialDrifters();
  }

  handleMessage(message: SharedClientMessage, sink: SimEventSink): void {
    switch (message.type) {
      case 'join':
        this.addPlayer(message.playerId, message.playerName);
        sink.send({
          type: 'welcome',
          matchId: this.matchId,
          playerId: message.playerId,
          serverTimeMs: this.elapsedMs,
        });
        return;
      case 'player_pose':
        this.updatePlayerPose(message);
        return;
      case 'extract_request':
        this.tryExtract(message.playerId, sink);
        return;
      case 'fire_laser':
        this.fireLaser(message.lane);
        return;
      case 'terminal_ack':
        return;
    }
  }

  addPlayer(id: string, name: string): SharedPlayerState {
    const existing = this.players.get(id);
    if (existing) {
      existing.name = name;
      if (existing.status === 'left') existing.status = 'active';
      return existing;
    }
    const offset = this.players.size === 0 ? -0.05 : 0.05;
    const player: SharedPlayerState = {
      id,
      name,
      x: clamp01(0.5 + offset),
      y: 0.75,
      angle: -Math.PI / 2,
      shielded: false,
      status: 'active',
      score: 0,
      terminalTime: null,
    };
    this.players.set(id, player);
    return player;
  }

  markLeft(playerId: string): SharedServerMessage | null {
    const player = this.players.get(playerId);
    if (!player) return null;
    player.status = 'left';
    player.terminalTime = this.elapsedMs;
    return { type: 'peer_left', playerId };
  }

  tick(deltaMs: number, sink: SimEventSink): void {
    const boundedDelta = Math.max(0, Math.min(deltaMs, 100));
    this.elapsedMs += boundedDelta;
    this.phaseTimerMs += boundedDelta;
    this.tickId++;
    this.updateGate();
    this.updateEntities(boundedDelta);
    this.resolveResourceDrain(boundedDelta, sink);
    this.resolvePlayerDrifterHits(sink);
    this.resolveLaserHits(sink);
    this.ensureSalvagePopulation(boundedDelta);
    this.ensureDrifterPopulation(boundedDelta);
  }

  getSnapshot(): SharedWorldSnapshot {
    return {
      type: 'world_snapshot',
      matchId: this.matchId,
      tick: this.tickId,
      timeMs: Math.round(this.elapsedMs),
      phase: this.phase,
      players: [...this.players.values()].map((p) => ({ ...p })),
      drifters: this.drifters.map(({ depletedTimerMs: _timer, ...d }) => ({ ...d })),
      salvage: this.salvage.map(({ depletedTimerMs: _timer, lifetimeMs: _lifetime, ...s }) => ({ ...s })),
      lasers: this.lasers.map((l) => ({ ...l })),
      gate: this.gate ? { ...this.gate } : null,
    };
  }

  private updatePlayerPose(message: Extract<SharedClientMessage, { type: 'player_pose' }>): void {
    const player = this.players.get(message.playerId);
    if (!player || player.status !== 'active') return;
    player.x = clamp01(message.x);
    player.y = clamp01(message.y);
    player.angle = Number.isFinite(message.angle) ? message.angle : player.angle;
    if (message.shielded && !this.consumedShieldPlayers.has(player.id)) {
      player.shielded = true;
    } else if (!message.shielded) {
      player.shielded = false;
      this.consumedShieldPlayers.delete(player.id);
    }
  }

  private tryExtract(playerId: string, sink: SimEventSink): void {
    const player = this.players.get(playerId);
    if (!player || player.status !== 'active' || !this.gate?.extractable) return;
    if (distance(player.x, player.y, this.gate.x, this.gate.y) > PLAYER_RADIUS + EXTRACT_HITBOX) return;
    player.status = 'extracted';
    player.terminalTime = this.elapsedMs;
    sink.send({
      type: 'player_terminal',
      playerId,
      status: 'extracted',
      score: Math.round(player.score),
      timeMs: Math.round(this.elapsedMs),
    });
  }

  private fireLaser(lane: SharedLaserLane): void {
    const isHorizontal = lane === 'top' || lane === 'middle' || lane === 'bottom';
    const positions: Record<SharedLaserLane, number> = {
      top: 0.25,
      middle: 0.5,
      bottom: 0.75,
      left: 0.25,
      center: 0.5,
      right: 0.75,
    };
    this.lasers.push({
      id: this.createId('laser'),
      lane,
      axis: isHorizontal ? 'h' : 'v',
      pos: positions[lane],
      width: VERSUS_LASER_WIDTH_N,
      lethal: false,
      remainingMs: VERSUS_LASER_WARNING_MS + VERSUS_LASER_LETHAL_MS,
    });
  }

  private updateGate(): void {
    const gateStart = PHASE_LENGTH - EXIT_GATE_PREVIEW;
    if (!this.gate && this.phaseTimerMs >= gateStart) {
      this.gate = {
        x: 0.2 + this.random() * 0.6,
        y: this.random() < 0.5 ? 0.16 : 0.84,
        radius: 0.09,
        extractable: false,
        timeRemaining: EXIT_GATE_PREVIEW + EXIT_GATE_DURATION,
        phase: this.phase,
      };
    }
    if (!this.gate) return;
    const gateElapsed = this.phaseTimerMs - gateStart;
    this.gate.extractable = gateElapsed >= EXIT_GATE_PREVIEW;
    this.gate.timeRemaining = Math.max(0, EXIT_GATE_PREVIEW + EXIT_GATE_DURATION - gateElapsed);
    if (gateElapsed >= EXIT_GATE_PREVIEW + EXIT_GATE_DURATION) {
      this.gate = null;
      this.phase++;
      this.phaseTimerMs = 0;
      this.drifterSpawnTimerMs = 0;
    }
  }

  private updateEntities(deltaMs: number): void {
    const dt = deltaMs / 1000;
    for (const entity of this.drifters) {
      this.updateMovingEntity(entity, dt, deltaMs);
    }
    for (const entity of this.salvage) {
      this.updateMovingEntity(entity, dt, deltaMs);
      if (entity.lifetimeMs > 0 && !entity.depleted) {
        entity.lifetimeMs -= deltaMs;
        if (entity.lifetimeMs <= 0) entity.depleted = true;
      }
    }
    for (const laser of this.lasers) {
      laser.remainingMs -= deltaMs;
      laser.lethal = laser.remainingMs <= VERSUS_LASER_LETHAL_MS;
    }
    this.lasers = this.lasers.filter((laser) => laser.remainingMs > 0);
    const hadNormal = this.salvage.some((s) => !s.rare);
    this.drifters = this.drifters.filter((d) => !this.shouldRemoveEntity(d));
    this.salvage = this.salvage.filter((s) => !this.shouldRemoveEntity(s));
    const hasNormal = this.salvage.some((s) => !s.rare);
    if (hadNormal && !hasNormal && this.salvageRespawnTimerMs <= 0) {
      this.salvageRespawnTimerMs = SALVAGE_RESPAWN_DELAY;
    }
  }

  private resolveResourceDrain(deltaMs: number, sink: SimEventSink): void {
    const dt = deltaMs / 1000;
    const activePlayers = [...this.players.values()].filter((p) => p.status === 'active');
    for (const player of activePlayers) {
      let salvageIncome = 0;
      let miningIncome = 0;
      for (const item of this.salvage) {
        if (item.depleted) continue;
        if (distance(player.x, player.y, item.x, item.y) <= item.radius) {
          const points = SALVAGE_POINTS_PER_SECOND * (item.rare ? 3 : 1) * dt;
          salvageIncome += points;
          item.hp -= dt;
          if (item.hp <= 0) item.depleted = true;
        }
      }
      for (const drifter of this.drifters) {
        if (!drifter.mineable || drifter.radiusScale < 1.5 || drifter.depleted) continue;
        const dist = distance(player.x, player.y, drifter.x, drifter.y);
        const miningRadius = drifter.radius * DRIFTER_MINING_RADIUS_MULT;
        if (dist <= miningRadius && dist > drifter.radius) {
          const proximity = 1 - (dist - drifter.radius) / (miningRadius - drifter.radius);
          const perSecond = DRIFTER_MINING_POINTS_MIN + (DRIFTER_MINING_POINTS_MAX - DRIFTER_MINING_POINTS_MIN) * proximity * proximity;
          miningIncome += perSecond * dt;
          drifter.hp -= dt;
          if (drifter.hp <= 0) drifter.depleted = true;
        }
      }
      if (salvageIncome > 0 || miningIncome > 0) {
        player.score += salvageIncome + miningIncome;
        sink.send({
          type: 'score_delta',
          playerId: player.id,
          salvage: salvageIncome,
          mining: miningIncome,
          totalScore: player.score,
        });
      }
    }
  }

  private resolveLaserHits(sink: SimEventSink): void {
    for (const laser of this.lasers) {
      if (!laser.lethal) continue;
      for (const drifter of this.drifters) {
        if (this.laserHits(laser, drifter.x, drifter.y, drifter.radius)) drifter.depleted = true;
      }
      for (const salvage of this.salvage) {
        if (this.laserHits(laser, salvage.x, salvage.y, salvage.radius)) salvage.depleted = true;
      }
      for (const player of this.players.values()) {
        if (player.status !== 'active') continue;
        if (!this.laserHits(laser, player.x, player.y, PLAYER_RADIUS)) continue;
        if (player.shielded) {
          player.shielded = false;
          this.consumedShieldPlayers.add(player.id);
          continue;
        }
        player.status = 'dead';
        player.terminalTime = this.elapsedMs;
        sink.send({
          type: 'player_terminal',
          playerId: player.id,
          status: 'dead',
          score: Math.round(player.score),
          timeMs: Math.round(this.elapsedMs),
          cause: 'laser',
        });
      }
    }
  }

  private resolvePlayerDrifterHits(sink: SimEventSink): void {
    for (const player of this.players.values()) {
      if (player.status !== 'active') continue;
      for (const drifter of this.drifters) {
        if (drifter.depleted) continue;
        if (distance(player.x, player.y, drifter.x, drifter.y) > PLAYER_RADIUS + drifter.radius) continue;
        if (player.shielded) {
          player.shielded = false;
          this.consumedShieldPlayers.add(player.id);
          drifter.hp = 0;
          drifter.depleted = true;
          drifter.depletedTimerMs = 0;
          continue;
        }
        player.status = 'dead';
        player.terminalTime = this.elapsedMs;
        sink.send({
          type: 'player_terminal',
          playerId: player.id,
          status: 'dead',
          score: Math.round(player.score),
          timeMs: Math.round(this.elapsedMs),
          cause: 'asteroid',
        });
        break;
      }
    }
  }

  private laserHits(laser: SharedLaserState, x: number, y: number, radius: number): boolean {
    const dist = laser.axis === 'h' ? Math.abs(y - laser.pos) : Math.abs(x - laser.pos);
    return dist <= laser.width / 2 + radius;
  }

  private ensureSalvagePopulation(deltaMs: number): void {
    const hasNormal = this.salvage.some((s) => !s.rare);
    if (!hasNormal) {
      if (this.salvageRespawnTimerMs <= 0) {
        this.spawnSalvage(false);
      } else {
        this.salvageRespawnTimerMs = Math.max(0, this.salvageRespawnTimerMs - deltaMs);
      }
    }

    if (this.phase >= 2) {
      this.rareSalvageTimerMs += deltaMs;
      const rareInterval = Math.max(8000, 18000 - this.phase * 2000);
      const hasRare = this.salvage.some((s) => s.rare);
      if (!hasRare && this.rareSalvageTimerMs >= rareInterval) {
        this.spawnSalvage(true);
        this.rareSalvageTimerMs = 0;
      }
    } else {
      this.rareSalvageTimerMs = 0;
    }
  }

  private ensureDrifterPopulation(deltaMs: number): void {
    const config = getSharedPhaseConfig(this.phase);
    this.drifterSpawnTimerMs += deltaMs;
    if (this.drifters.length >= config.maxConcurrentDrifters) return;
    if (this.drifterSpawnTimerMs < config.hazardSpawnRate) return;
    this.spawnDrifter();
    this.drifterSpawnTimerMs = 0;
  }

  private spawnSalvage(rare: boolean): void {
    const radius = rare ? RARE_SALVAGE_RADIUS_N : NORMAL_SALVAGE_RADIUS_N;
    const spawn = this.pickEdgeSpawn(radius);
    const target = this.pickInteriorTarget(radius);
    const speed = this.randomRange(SALVAGE_DRIFT_SPEED_MIN, SALVAGE_DRIFT_SPEED_MAX) / CANONICAL_ARENA_SIZE;
    const velocity = this.velocityToward(spawn.x, spawn.y, target.x, target.y, speed);
    this.salvage.push({
      id: this.createId('salvage'),
      x: spawn.x,
      y: spawn.y,
      vx: velocity.vx,
      vy: velocity.vy,
      radius,
      rare,
      hp: rare ? SALVAGE_MAX_HP * 0.5 : SALVAGE_MAX_HP,
      maxHp: rare ? SALVAGE_MAX_HP * 0.5 : SALVAGE_MAX_HP,
      depleted: false,
      depletedTimerMs: 0,
      lifetimeMs: rare ? 12000 : 0,
    });
  }

  private spawnDrifter(): void {
    const config = getSharedPhaseConfig(this.phase);
    const radiusScale = this.pickAsteroidSize(this.phase);
    const radius = DRIFTER_RADIUS_N * radiusScale;
    const speed = (DRIFTER_SPEED_BASE * config.hazardSpeedMultiplier * (1 / Math.sqrt(radiusScale))) / CANONICAL_ARENA_SIZE;
    const spawn = this.pickEdgeSpawn(radius);
    const target = this.pickOppositeTarget(spawn.edge, radius);
    const velocity = this.velocityToward(spawn.x, spawn.y, target.x, target.y, speed);
    this.drifters.push({
      id: this.createId('drifter'),
      x: spawn.x,
      y: spawn.y,
      vx: velocity.vx,
      vy: velocity.vy,
      radius,
      radiusScale,
      mineable: this.random() < DRIFTER_MINEABLE_CHANCE,
      hp: DRIFTER_MAX_HP * radiusScale,
      maxHp: DRIFTER_MAX_HP * radiusScale,
      depleted: false,
      depletedTimerMs: 0,
    });
  }

  private updateMovingEntity(
    entity: SharedDrifterSimState | SharedSalvageSimState,
    dt: number,
    deltaMs: number,
  ): void {
    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;
    if (entity.depleted) {
      entity.depletedTimerMs += deltaMs;
      return;
    }
    if (
      entity.x < -OFFSCREEN_MARGIN_N - entity.radius ||
      entity.x > SNAPSHOT_WORLD_SIZE + OFFSCREEN_MARGIN_N + entity.radius ||
      entity.y < -OFFSCREEN_MARGIN_N - entity.radius ||
      entity.y > SNAPSHOT_WORLD_SIZE + OFFSCREEN_MARGIN_N + entity.radius
    ) {
      entity.depleted = true;
      entity.depletedTimerMs = HP_DEPLETED_WARN_TIME;
    }
  }

  private shouldRemoveEntity(entity: SharedDrifterSimState | SharedSalvageSimState): boolean {
    return entity.depleted && entity.depletedTimerMs >= HP_DEPLETED_WARN_TIME;
  }

  private seedInitialDrifters(): void {
    const config = getSharedPhaseConfig(this.phase);
    const count = Math.min(4, config.maxConcurrentDrifters);
    for (let i = 0; i < count; i++) {
      this.spawnDrifter();
    }
  }

  private pickAsteroidSize(phase: number): number {
    const pools: Record<number, [number, number][]> = {
      1: [[1, 3], [1.5, 2], [2, 1]],
      2: [[0.8, 2], [1.5, 3], [2.2, 2], [3, 1]],
      3: [[0.7, 1], [1.5, 2], [2.5, 3], [3.5, 2], [4.5, 1]],
      4: [[0.7, 1], [1.5, 1], [2.5, 2], [3.8, 3], [5, 2]],
      5: [[0.7, 1], [2, 1], [3.5, 3], [5, 3], [6, 2]],
    };
    const pool = pools[Math.min(phase, 5)] ?? pools[1];
    const total = pool.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = this.random() * total;
    for (const [scale, weight] of pool) {
      roll -= weight;
      if (roll <= 0) return scale;
    }
    return 1;
  }

  private pickEdgeSpawn(radius: number): { x: number; y: number; edge: 0 | 1 | 2 | 3 } {
    const edge = Math.floor(this.random() * 4) as 0 | 1 | 2 | 3;
    const margin = radius + 0.025;
    switch (edge) {
      case 0:
        return { edge, x: this.random(), y: -margin };
      case 1:
        return { edge, x: this.random(), y: 1 + margin };
      case 2:
        return { edge, x: -margin, y: this.random() };
      case 3:
        return { edge, x: 1 + margin, y: this.random() };
    }
  }

  private pickInteriorTarget(radius: number): { x: number; y: number } {
    const margin = Math.max(radius, 0.08);
    return {
      x: margin + this.random() * (1 - margin * 2),
      y: 0.3 + this.random() * 0.4,
    };
  }

  private pickOppositeTarget(edge: 0 | 1 | 2 | 3, radius: number): { x: number; y: number } {
    const margin = radius + 0.025;
    switch (edge) {
      case 0:
        return { x: this.random(), y: 1 + margin };
      case 1:
        return { x: this.random(), y: -margin };
      case 2:
        return { x: 1 + margin, y: this.random() };
      case 3:
        return { x: -margin, y: this.random() };
    }
  }

  private velocityToward(
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    speed: number,
  ): { vx: number; vy: number } {
    const dx = targetX - x;
    const dy = targetY - y;
    const len = Math.max(0.0001, Math.hypot(dx, dy));
    const cappedSpeed = Math.min(speed, DRIFTER_SPEED_MAX / CANONICAL_ARENA_SIZE);
    return {
      vx: (dx / len) * cappedSpeed,
      vy: (dy / len) * cappedSpeed,
    };
  }

  private randomRange(min: number, max: number): number {
    return min + (max - min) * this.random();
  }

  private createId(prefix: string): string {
    const id = `${prefix}_${this.nextEntityId.toString(36)}`;
    this.nextEntityId++;
    return id;
  }
}
